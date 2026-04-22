const client = require('./config');
const moment = require('moment');
const logger = require('../utils/logger');

/**
 * Database client for storing and retrieving tee times
 */
class DbClient {
    /**
     * Get a course by its ID
     * @param {string} id - Course ID
     * @returns {Promise<Object>} - Course object
     */
    async getCourse(id) {
        try {
            const result = await client.query('SELECT * FROM golf_courses WHERE id = $1', [id]);
            return result.rows[0];
        } catch (error) {
            logger.error(`Error getting course ${id}:`, error);
            throw error;
        }
    }

    /**
     * Get all courses
     * @returns {Promise<Array>} - Array of course objects
     */
    async getAllCourses() {
        try {
            const result = await client.query('SELECT * FROM golf_courses');
            return result.rows;
        } catch (error) {
            logger.error('Error getting all courses:', error);
            throw error;
        }
    }

    /**
     * Save tee times for a course
     * @param {Number} courseId - Course ID
     * @param {Array} teeTimes - Array of tee time objects
     * @param {String} date - Date string in YYYY-MM-DD format
     * @returns {Promise<Array>} - Array of saved tee time objects
     */
    async saveTeeTimes(courseId, teeTimes, date) {
        try {
            await client.query('BEGIN');

            const startOfDay = moment(date).startOf('day').toISOString();
            const endOfDay = moment(date).endOf('day').toISOString();

            await client.query('DELETE FROM tee_times WHERE course_id = $1 AND tee_time BETWEEN $2 AND $3', [courseId, startOfDay, endOfDay]);

            const now = new Date();
            const futureTeeTimes = teeTimes.filter(teeTime => {
                const teeTimeDate = new Date(teeTime.time);
                return teeTimeDate > now;
            });

            const savedTeeTimes = [];

            for (const teeTime of futureTeeTimes) {
                const teeTimeDate = moment(teeTime.time).toISOString();
                const result = await client.query('INSERT INTO tee_times (course_id, tee_time, holes, spots, start_position) VALUES ($1, $2, $3, $4, $5) RETURNING *', [courseId, teeTimeDate, `{${teeTime.holes.sort((a, b) => a - b).join(',')}}`, teeTime.spots, teeTime.start || null]);
                savedTeeTimes.push(result.rows[0]);
            }
            await client.query('COMMIT');
            return savedTeeTimes;
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error(`Error saving tee times for course ${courseId}:`, error);
            throw error;
        }
    }

    /**
     * Deletes all tee times for the current day across all courses
     * @returns {Promise<Object[]>} Array of deleted tee time records
     */
    async deleteAllTeeTimesForCurrentDay() {
        try {
            const startOfDay = moment().startOf('day').toISOString();
            const endOfDay = moment().endOf('day').toISOString();

            const result = await client.query('DELETE FROM tee_times WHERE tee_time BETWEEN $1 AND $2 RETURNING *', [startOfDay, endOfDay]);

            logger.info(`Deleted ${result.rowCount} tee times for today ${moment().format('YYYY-MM-DD')}`);
            return result.rows;
        } catch (error) {
            logger.error('Error deleting tee times for today:', error);
            throw error;
        }
    }

    /**
     * Get tee times on a specific date
     * @param {String} date - Date string in YYYY-MM-DD format
     * @param {Number|null} holes - Optional holes filter (9 or 18); null returns all
     * @returns {Promise<Array>} - Array of tee time objects
     */
    async getTeeTimesByDate(date, holes = null) {
        try {
            if (!moment(date, 'YYYY-MM-DD', true).isValid()) {
                throw new Error('Invalid date format. Expected YYYY-MM-DD.');
            }

            const startOfDay = moment(date).startOf('day').toISOString();
            const endOfDay = moment(date).endOf('day').toISOString();
            const holesFilter = (holes === 9 || holes === 18) ? holes : null;

            const result = await client.query(
                `SELECT *
                 FROM tee_times
                 WHERE tee_time BETWEEN $1 AND $2
                   AND ($3::int IS NULL OR holes @> ARRAY[$3::int])
                 ORDER BY tee_time`,
                [startOfDay, endOfDay, holesFilter]
            );

            return result.rows.map(row => ({
                id: row.id,
                courseId: row.course_id,
                time: row.tee_time,
                holes: row.holes,
                start: row.start_position,
                spots: row.spots
            }));

        } catch (error) {
            logger.error(`Error getting tee times on ${date}: `, error);
            throw error;
        }
    }

    /**
     * Get tee times for a course on a specific date
     * @param {Number} courseId - Course ID
     * @param {String} date - Date string in YYYY-MM-DD format
     * @returns {Promise<Array>} - Array of tee time objects
     */
    async getTeeTimesByCourseAndDate(courseId, date) {
        try {
            const startOfDay = moment(date).startOf('day').toISOString();
            const endOfDay = moment(date).endOf('day').toISOString();

            const result = await client.query('SELECT * FROM tee_times WHERE course_id = $1 AND tee_time BETWEEN $2 AND $3 ORDER BY tee_time', [courseId, startOfDay, endOfDay]);

            return result.rows.map(row => ({
                id: row.id,
                courseId: row.course_id,
                time: row.tee_time,
                holes: row.holes,
                start: row.start_position,
                spots: row.spots
            }));

        } catch (error) {
            logger.error(`Error getting tee times for course ${courseId} on ${date}`, error);
            throw error;
        }
    }
}

module.exports = new DbClient();
