const express = require('express');
const router = express.Router();
const dbClient = require('../database/client');

/* GET home page. */
router.get('/', async (req, res) => {
    try {
        const courses = await dbClient.getAllCourses();
        res.json({
            title: 'Golf Tee Time API',
            version: '1.0.0',
            courses_count: courses.length,
            endpoints: {
                '/api/tee-times/courses': 'Get all available golf courses',
                '/api/tee-times/:courseId/:date': 'Get tee times for a specific course and date',
                '/api/tee-times/refresh/:courseId': 'Manually refresh tee times for a course (POST)'
            }
        });
    } catch (error) {
        res.status(500).json({error: 'Error fetching API information'});
    }
});

module.exports = router;