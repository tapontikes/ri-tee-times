const express = require('express');
const router = express.Router();
const dbClient = require('../../database/client');
const logger = require('../../utils/logger');
const moment = require('moment-timezone');
const {refreshAllCoursesByDate, refreshTeeTimesForCourse} = require('../../jobs/teetime');
const {rateLimit} = require('express-rate-limit');

// The refresh endpoints are used by the admin page and each one scrapes third-party booking
// sites, so cap how often / how many can run. This keeps abuse from hammering upstream sites
// (and getting this server's IP blocked) without changing how the admin page works.
const REFRESH_ALL_COOLDOWN_MS = 60 * 1000;     // same date, all courses
const REFRESH_COURSE_COOLDOWN_MS = 15 * 1000;  // same course + date
const MAX_CONCURRENT_REFRESHES = 3;
const refreshLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 60,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {error: 'Too many refresh requests. Try again in a minute.'}
});
const lastRun = new Map();   // key -> timestamp of the last accepted run
let activeRefreshes = 0;

// Returns an error message when this refresh must be rejected, otherwise null.
function refreshRejection(key, cooldownMs) {
    if (activeRefreshes >= MAX_CONCURRENT_REFRESHES) return 'Too many refreshes are already running.';
    const last = lastRun.get(key) || 0;
    if (Date.now() - last < cooldownMs) return 'This was refreshed very recently. Try again shortly.';
    return null;
}

async function guardedRefresh(key, cooldownMs, res, work) {
    const rejection = refreshRejection(key, cooldownMs);
    if (rejection) {
        res.set('Retry-After', String(Math.ceil(cooldownMs / 1000)));
        return res.status(429).json({error: rejection});
    }
    lastRun.set(key, Date.now());
    if (lastRun.size > 5000) {   // keep the map bounded
        const cutoff = Date.now() - 10 * 60 * 1000;
        for (const [k, t] of lastRun) if (t < cutoff) lastRun.delete(k);
    }
    activeRefreshes++;
    try {
        await work();
    } finally {
        activeRefreshes--;
    }
}

// Get all available courses
router.get('/courses', async (req, res, next) => {
    try {
        const courses = await dbClient.getAllCourses();
        res.json(courses);
    } catch (error) {
        logger.error('Error fetching courses:', error);
        next(error);
    }
});

// Get tee times for a specific course and date
router.get('/:courseId/:date', async (req, res, next) => {
    try {
        const {courseId, date} = req.params;

        // Validate date format
        if (!moment(date, 'YYYY-MM-DD', true).isValid()) {
            return res.status(400).json({error: 'Invalid date format. Use YYYY-MM-DD'});
        }

        const teeTimes = await dbClient.getTeeTimesByCourseAndDate(courseId, date);

        res.json(teeTimes);

    } catch (error) {
        logger.error('Error fetching tee times:', error);
        next(error);
    }
});

// Get all tee times for a specific date
router.get('/all', async (req, res, next) => {
    try {
        const {date, holes} = req.query;

        // Validate date format
        if (!moment(date, 'YYYY-MM-DD', true).isValid()) {
            return res.status(400).json({error: 'Invalid date format. Use YYYY-MM-DD'});
        }

        const holesFilter = holes ? parseInt(holes, 10) : null;
        const teeTimes = await dbClient.getTeeTimesByDate(date, holesFilter);

        res.json(teeTimes);

    } catch (error) {
        logger.error('Error fetching tee times:', error);
        next(error);
    }
});

router.get('/last-refreshed', async (req, res, next) => {
    try {
        const {date} = req.query;
        if (!date || !moment(date, 'YYYY-MM-DD', true).isValid()) {
            return res.status(400).json({error: 'Invalid or missing date. Use YYYY-MM-DD'});
        }
        const ts = await dbClient.getLastRefreshedAt(date);
        res.json({lastRefreshedAt: ts ? new Date(ts).toISOString() : null});
    } catch (error) {
        next(error);
    }
});

router.post('/refresh/all', refreshLimiter, async (req, res, next) => {
    try {
        const {date} = req.body;

        if (!moment(date, 'YYYY-MM-DD', true).isValid()) {
            return res.status(400).json({error: 'Invalid date format. Use YYYY-MM-DD'});
        }

        await guardedRefresh(`all:${date}`, REFRESH_ALL_COOLDOWN_MS, res, async () => {
            await refreshAllCoursesByDate(moment(date, 'YYYY-MM-DD'));
            res.json({success: true, message: `Tee times refreshed for all courses`});
        });
    } catch (error) {
        logger.error(`Error refreshing tee times for all courses: `, error);
        next(error);
    }
});

router.post('/refresh/:courseId', refreshLimiter, async (req, res, next) => {
    try {
        const {courseId} = req.params;
        const {date} = req.body;

        if (!/^\d{1,9}$/.test(courseId)) {
            return res.status(400).json({error: 'Invalid course id'});
        }
        if (!date || !moment(date, 'YYYY-MM-DD', true).isValid()) {
            return res.status(400).json({error: 'Invalid or missing date. Use YYYY-MM-DD format in request body'});
        }

        await guardedRefresh(`course:${courseId}:${date}`, REFRESH_COURSE_COOLDOWN_MS, res, async () => {
            await refreshTeeTimesForCourse(courseId, date);
            res.json({success: true, message: `Tee times refreshed for course ${courseId} on ${date}`});
        });
    } catch (error) {
        logger.error(`Error refreshing tee times for course ${req.params.courseId}:`, error);
        next(error);
    }
});

module.exports = router;