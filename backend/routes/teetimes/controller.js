const express = require('express');
const router = express.Router();
const dbClient = require('../../database/client');
const logger = require('../../utils/logger');
const moment = require('moment-timezone');
const {refreshAllCoursesByDate, refreshTeeTimesForCourse} = require('../../jobs/teetime');

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

router.post('/refresh/all', async (req, res, next) => {
    try {
        const {date} = req.body;

        if (!moment(date, 'YYYY-MM-DD', true).isValid()) {
            return res.status(400).json({error: 'Invalid date format. Use YYYY-MM-DD'});
        }

        await refreshAllCoursesByDate(moment(date, 'YYYY-MM-DD'));

        res.json({success: true, message: `Tee times refreshed for all courses`});
    } catch (error) {
        logger.error(`Error refreshing tee times for all courses: `, error);
        next(error);
    }
});

router.post('/refresh/:courseId', async (req, res, next) => {
    try {
        const {courseId} = req.params;
        const {date} = req.body;

        if (!date || !moment(date, 'YYYY-MM-DD', true).isValid()) {
            return res.status(400).json({error: 'Invalid or missing date. Use YYYY-MM-DD format in request body'});
        }

        await refreshTeeTimesForCourse(courseId, date);

        res.json({success: true, message: `Tee times refreshed for course ${courseId} on ${date}`});
    } catch (error) {
        logger.error(`Error refreshing tee times for course ${req.params.courseId}:`, error);
        next(error);
    }
});

module.exports = router;