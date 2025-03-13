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

        logger.info(`Refreshing tee times for course ${course.name} on ${date}`);

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

        // Save the tee times to the database
        await client.saveTeeTimes(course.id, teeTimes, date);
        logger.info(`Saved ${teeTimes.length} tee times for course ${course.name} on ${date}`);
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
function refreshAllCoursesSevenDays() {
    return async () => {
        try {
            const courses = await client.getAllCourses();
            logger.info(`Refreshing tee times for all ${courses.length} courses for the next 7 days`);

            for (const course of courses) {
                for (let i = 0; i < 7; i++) {  // Loop over the next 7 days
                    const targetDate = moment().add(i, 'days');
                    await refreshTeeTimesForCourse(course.id, targetDate);
                }
            }
        } catch (error) {
            logger.error('Error refreshing tee times for all courses:', error);
        }
    };
}

/**
 * Initialize all tee time jobs
 */
async function initializeJobs() {
    // Schedule jobs for each provider
    for (const [provider, providerConfig] of Object.entries(config.apis)) {
        const jobName = `refresh-${provider}-tee-times`;
        scheduler.scheduleJob(jobName, providerConfig.cronSchedule, refreshAllCoursesSevenDays());
    }
}

module.exports = {
    initializeJobs,
    refreshAllCoursesByDate,
    refreshTeeTimesForCourse,
    refreshAllCoursesSevenDays
};