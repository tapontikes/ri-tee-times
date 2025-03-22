const logger = require('../../../../utils/logger');
const moment = require('moment');

/**
 * Get the session status for a TeesNap domain
 * @param {Object} client - Axios client with cookie jar support
 * @param {string} domain - The domain to check session for
 * @returns {Promise<Object>} Session status information
 */
async function getSessionStatus(client, domain) {
    try {
        // Extract cookies from jar
        const cookies = client.defaults.jar.getCookiesSync(domain);

        // Find the laravel_session cookie which indicates an active session
        const sessionCookie = cookies.find(cookie => cookie.key === 'laravel_session');
        const xsrfCookie = cookies.find(cookie => cookie.key === 'XSRF-TOKEN');

        if (!sessionCookie || !xsrfCookie) {
            return {
                isActive: false,
                expiresAt: null,
                domain
            };
        }

        // Get expiry time from the session cookie
        const expiryTime = moment(sessionCookie.expires);
        const now = moment();

        // Check if the session is still valid (not expired)
        const isActive = expiryTime.isAfter(now);

        return {
            isActive,
            expiresAt: expiryTime.format(),
            domain,
            // Include time remaining in seconds
            expiresIn: expiryTime.diff(now, 'seconds')
        };
    } catch (error) {
        logger.error(`Error checking session status: ${error.message}`);
        throw error;
    }
}

module.exports = {
    getSessionStatus
};