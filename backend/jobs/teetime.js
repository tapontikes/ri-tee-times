const moment = require('moment');
const config = require('../config');
const client = require('../database/client');
const logger = require('../utils/logger');
const Scheduler = require('./scheduler');

// Import API services
const foreUpService = require('../service/courses/foreup-service');
const teeItUpService = require('../service/courses/teeitup-service');
const teeSnapService = require('../service/courses/teesnap-service');
const teeWireService = require('../service/courses/teewire-service');

// Create a scheduler instance
const scheduler = new Scheduler();

/**
 * Refresh tee times for a specific course on a specific date
 * @param {Object} courseId - ID of the course
 * @param {Moment} date - Date string in YYYY-MM-DD format
 */
async function refreshTeeTimesForCourse(courseId, date) {
    try {
        // Get course details
        const course = await client.getCourse(courseId);

        if (!course) {
            logger.error(`Course with ID ${courseId} not found`);
            return;
        }

        let teeTimes = [];

        // Call the appropriate service based on the provider
        switch (course.provider) {
            case 'foreup':
                teeTimes = await foreUpService.getForeUpTeeTimes(moment(date).format('MM-DD-YYYY'), course.request_data);
                break;
            case 'teeitup':
                teeTimes = await teeItUpService.getTeeItUpTeeTimes(moment(date).format("YYYY-MM-DD"), course.request_data);
                break;
            case 'teesnap':
                teeTimes = await teeSnapService.getTeeSnapTeeTimes(moment(date).format("YYYY-MM-DD"), course.booking_url, course.request_data);
                break;
            case 'teewire':
                teeTimes = await teeWireService.getTeeWireTeeTime(moment(date).format('MM/DD/YYYY'), course.request_data);
                break;
            default:
                logger.error(`Unknown provider: ${course.provider}`);
                return;
        }

        if (!teeTimes || teeTimes.length === 0) {
            logger.warn(`No tee times found for course ${course.name} on ${date}`);
            return;
        }

        await client.saveTeeTimes(course.id, teeTimes, date);
    } catch (error) {
        logger.error(`Error refreshing tee times for course ${courseId}:`, error);
    }
}

/**
 * Refresh tee times for all course on a specific date
 * @param {Moment} date - Date string in YYYY-MM-DD format
 */
async function refreshAllCoursesByDate(date) {
    try {
        const courses = await client.getAllCourses();
        logger.info(`Refreshing tee times for all courses on: ${date}`);

        for (const course of courses) {
            await refreshTeeTimesForCourse(course.id, date);
        }
    } catch (error) {
        logger.error('Error refreshing tee times for all courses:', error);
    }

}

/**
 * Create a job to refresh tee times for all courses
 */
function refreshAllTeeTimesJob() {
    return async () => {
        const errors = [];
        let successCount = 0;
        try {
            const courses = await client.getAllCourses();

            for (const course of courses) {
                try {
                    for (let i = 0; i < 7; i++) {  // Loop over the next 7 days
                        const targetDate = moment().add(i, 'days');
                        await refreshTeeTimesForCourse(course.id, targetDate);
                    }
                    successCount++;
                } catch (error) {
                    errors.push({
                        courseId: course.id,
                        courseName: course.name,
                        error: error.message
                    });
                }
            }

            // Log summary after completion
            logger.info(`Refreshed ${successCount} out of ${courses.length} courses for the next 7 days`);

            // Log errors if any
            if (errors.length > 0) {
                logger.error(`Encountered ${errors.length} errors while refreshing tee times:`, errors);
            }
        } catch (error) {
            logger.error('Error getting courses for tee time refresh:', error);
        }
    };
}

/**
 * Create a job to delete all tee times at 11:59pm for the current day
 */
function removeOldTeeTimesJob() {
    return async () => {
        try {
            await client.deleteAllTeeTimesForCurrentDay();
        } catch (error) {
            logger.error('Error cleaning up tee times:', error);
        }
    };
}

/**
 * Initialize all tee time jobs
 */
async function initializeJobs() {
    // Schedule jobs for removing old tee times at the end of the day
    scheduler.scheduleJob('remove-old-tee-times', '59 23 * * *', removeOldTeeTimesJob());

    // Schedule refresh jobs
    for (const [provider, providerConfig] of Object.entries(config.apis)) {
        const jobName = `refresh-${provider}-tee-times`;
        scheduler.scheduleJob(jobName, providerConfig.cronSchedule, refreshAllTeeTimesJob());
    }
}

module.exports = {
    initializeJobs,
    refreshAllCoursesByDate,
    refreshTeeTimesForCourse,
    refreshAllTeeTimesJob,
};