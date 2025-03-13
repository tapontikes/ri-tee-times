const schedule = require('node-schedule');
const logger = require('../utils/logger');

/**
 * Scheduler for managing cron jobs
 */
class Scheduler {
    constructor() {
        this.jobs = {};
    }

    /**
     * Schedule a job to run at a specified interval
     * @param {String} jobName - Name of the job
     * @param {String} cronExpression - Cron expression for the schedule
     * @param {Function} jobFunction - Function to execute
     * @returns {Object} - The scheduled job
     */
    scheduleJob(jobName, cronExpression, jobFunction) {
        try {
            // Cancel existing job with the same name if it exists
            if (this.jobs[jobName]) {
                this.cancelJob(jobName);
            }

            logger.info(`Scheduling job "${jobName}" with cron expression: ${cronExpression}`);

            // Schedule the new job
            const job = schedule.scheduleJob(jobName, cronExpression, async () => {
                try {
                    logger.info(`Executing job "${jobName}"`);
                    await jobFunction();
                    logger.info(`Job "${jobName}" completed successfully`);
                } catch (error) {
                    logger.error(`Error executing job "${jobName}":`, error);
                }
            });

            this.jobs[jobName] = job;
            return job;
        } catch (error) {
            logger.error(`Error scheduling job "${jobName}":`, error);
            throw error;
        }
    }

    /**
     * Cancel a scheduled job
     * @param {String} jobName - Name of the job to cancel
     * @returns {Boolean} - True if the job was cancelled, false otherwise
     */
    cancelJob(jobName) {
        if (this.jobs[jobName]) {
            logger.info(`Cancelling job "${jobName}"`);
            this.jobs[jobName].cancel();
            delete this.jobs[jobName];
            return true;
        }

        logger.warn(`Job "${jobName}" not found`);
        return false;
    }

    /**
     * Get all scheduled jobs
     * @returns {Object} - Object containing all scheduled jobs
     */
    getJobs() {
        return this.jobs;
    }
}

module.exports = Scheduler;