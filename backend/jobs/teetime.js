const moment = require('moment');
const client = require('../database/client');
const logger = require('../utils/logger');
const Scheduler = require('./scheduler');
const {client: ldClient} = require('../utils/launchdarkly');

const foreUpService = require('../service/foreup/teetimes/service');
const teeItUpService = require('../service/teeitup/teetimes/service');
const teeSnapService = require('../service/teesnap/teetimes/service');
const teeWireService = require('../service/teewire/teetimes/service');

const scheduler = new Scheduler();

// Minimum ms between consecutive calls to the same provider to avoid 403s
const PROVIDER_DELAY_MS = {
    foreup: 600,
    teeitup: 400,
    teesnap: 400,
    teewire: 600,
};
const DEFAULT_PROVIDER_DELAY_MS = 400;

const lastProviderCallAt = {};

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function enforceProviderRateLimit(provider) {
    const required = PROVIDER_DELAY_MS[provider] ?? DEFAULT_PROVIDER_DELAY_MS;
    const elapsed = Date.now() - (lastProviderCallAt[provider] ?? 0);
    if (elapsed < required) {
        const wait = required - elapsed;
        logger.debug(`[rate-limit] ${provider}: waiting ${wait}ms before next request`);
        await sleep(wait);
    }
    lastProviderCallAt[provider] = Date.now();
}

/**
 * Refresh tee times for a specific course on a specific date.
 * Returns the number of tee times found and saved (0 = none available).
 */
async function refreshTeeTimesForCourse(courseId, date) {
    const course = await client.getCourse(courseId);

    if (!course) {
        throw new Error(`Course with ID ${courseId} not found`);
    }

    const dateStr = moment(date).format('YYYY-MM-DD');
    const tag = `[${course.provider.toUpperCase()}] ${course.name}`;

    logger.debug(`${tag} — fetching ${dateStr}`);
    await enforceProviderRateLimit(course.provider);

    let teeTimes = [];

    switch (course.provider) {
        case 'foreup':
            teeTimes = await foreUpService.getForeUpTeeTimes(moment(date).format('MM-DD-YYYY'), course.request_data);
            break;
        case 'teeitup':
            teeTimes = await teeItUpService.getTeeItUpTeeTimes(moment(date).format('YYYY-MM-DD'), course.request_data);
            break;
        case 'teesnap':
            teeTimes = await teeSnapService.getTeeSnapTeeTimes(moment(date).format('YYYY-MM-DD'), course.booking_url, course.request_data);
            break;
        case 'teewire':
            teeTimes = await teeWireService.getTeeWireTeeTime(moment(date).format('YYYY-MM-DD'), course.request_data);
            break;
        default:
            throw new Error(`Unknown provider: ${course.provider}`);
    }

    if (!teeTimes || teeTimes.length === 0) {
        logger.info(`${tag} — 0 tee times on ${dateStr}`);
        return 0;
    }

    logger.info(`${tag} — ${teeTimes.length} tee times on ${dateStr}, saving`);
    await client.saveTeeTimes(course.id, teeTimes, date);
    return teeTimes.length;
}

/**
 * Refresh tee times for all courses on a specific date
 */
async function refreshAllCoursesByDate(date) {
    const courses = await client.getAllCourses();
    logger.info(`Manual refresh: ${courses.length} courses on ${moment(date).format('YYYY-MM-DD')}`);

    for (const course of courses) {
        try {
            await refreshTeeTimesForCourse(course.id, date);
        } catch (error) {
            logger.error(`Error refreshing ${course.name} (${course.id}):`, error.message);
        }
    }
}

/**
 * Create a job to refresh tee times for all courses over a date range.
 * Stops querying further dates for a course once a date returns no tee times,
 * since that indicates the course isn't booking that far out yet.
 */
function refreshAllTeeTimesJob(startDay, endDay) {
    return async () => {
        const enabled = await ldClient.boolVariation('scheduler-enabled', {kind: 'user', key: 'server'}, true);
        if (!enabled) {
            logger.info('scheduler-enabled flag is off — skipping tee time refresh');
            return;
        }

        const jobLabel = `days +${startDay}–+${endDay - 1}`;
        const rangeStart = moment().add(startDay, 'days').format('YYYY-MM-DD');
        const rangeEnd = moment().add(endDay - 1, 'days').format('YYYY-MM-DD');
        const wallStart = Date.now();

        logger.info(`┌── Tee time refresh START [${jobLabel}] (${rangeStart} → ${rangeEnd})`);

        let courses;
        try {
            courses = await client.getAllCourses();
        } catch (error) {
            logger.error(`Failed to load courses for refresh [${jobLabel}]:`, error.message);
            return;
        }

        logger.info(`│   ${courses.length} courses to process`);

        const stats = {
            success: 0,
            failed: 0,
            skipped: 0,  // early-exit courses
            totalTeeTimes: 0,
        };
        const failures = [];

        for (const course of courses) {
            const tag = `[${course.provider.toUpperCase()}] ${course.name}`;
            let courseTimes = 0;
            let datesQueried = 0;
            let exitedEarly = false;

            try {
                for (let i = startDay; i < endDay; i++) {
                    const targetDate = moment().add(i, 'days');
                    const count = await refreshTeeTimesForCourse(course.id, targetDate);
                    datesQueried++;

                    if (count === 0) {
                        // Course isn't booking this far out — no point querying further dates
                        logger.info(`│   ${tag} — no times on day +${i}, stopping (booking horizon reached)`);
                        exitedEarly = true;
                        break;
                    }

                    courseTimes += count;
                }

                stats.success++;
                stats.totalTeeTimes += courseTimes;
                if (exitedEarly) stats.skipped++;

                const note = exitedEarly
                    ? ` — stopped at day +${startDay + datesQueried - 1} (horizon)`
                    : ` — ${datesQueried} date${datesQueried !== 1 ? 's' : ''}`;
                logger.info(`│   ✓ ${tag}: ${courseTimes} tee times${note}`);
            } catch (error) {
                stats.failed++;
                failures.push({name: course.name, error: error.message});
                logger.error(`│   ✗ ${tag}: ${error.message}`);
            }
        }

        const elapsed = ((Date.now() - wallStart) / 1000).toFixed(1);
        logger.info(
            `└── Tee time refresh DONE [${jobLabel}] ${elapsed}s — ` +
            `${stats.success}/${courses.length} OK, ` +
            `${stats.totalTeeTimes} tee times saved, ` +
            `${stats.skipped} horizon exits, ` +
            `${stats.failed} errors`
        );

        if (failures.length > 0) {
            logger.error(`    Failed courses:`, failures.map(f => `${f.name}: ${f.error}`).join(' | '));
        }
    };
}

/**
 * Create a job to delete all tee times for the current day at 11:59pm
 */
function removeOldTeeTimesJob() {
    return async () => {
        logger.info('Removing tee times for current day...');
        try {
            await client.deleteAllTeeTimesForCurrentDay();
            logger.info('Current-day tee times removed');
        } catch (error) {
            logger.error('Error cleaning up tee times:', error.message);
        }
    };
}

/**
 * Initialize all tee time jobs
 */
async function initializeJobs() {
    scheduler.scheduleJob('remove-old-tee-times', '59 23 * * *', removeOldTeeTimesJob());

    // Near-term: days 0–6, runs at :00 and :40 every hour
    scheduler.scheduleJob('refresh-near-term', '0,40 * * * *', refreshAllTeeTimesJob(0, 7));

    // Future-term: days 7–13, runs at :20 every hour
    scheduler.scheduleJob('refresh-future-term', '20 * * * *', refreshAllTeeTimesJob(7, 14));
}

module.exports = {
    initializeJobs,
    refreshAllCoursesByDate,
    refreshTeeTimesForCourse,
    refreshAllTeeTimesJob,
};
