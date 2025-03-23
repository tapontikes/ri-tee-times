const logger = require('../../../../utils/logger');
const moment = require('moment');

/**
 * Get the session status for a TeesNap domain
 * @param {Object} client - Axios client with cookie jar support
 * @param {string} domain - The domain to check session for
 * @returns {Promise<Object>} Session status information
 */
async function getSessionStatus(client, domain) {
    const cookies = client.defaults.jar.getCookiesSync(domain);

    const sessionCookie = cookies.find(cookie => cookie.key === 'laravel_session');
    const xsrfCookie = cookies.find(cookie => cookie.key === 'XSRF-TOKEN');

    if (!sessionCookie || !xsrfCookie) {
        return {
            isActive: false,
            expiresAt: null,
            domain
        };
    }

    const expiryTime = moment(sessionCookie.expires);
    const now = moment();

    const isActive = expiryTime.isAfter(now);

    return {
        isActive,
        expiresAt: expiryTime.format(),
        domain,
        expiresIn: expiryTime.diff(now, 'seconds')
    };
}

module.exports = {
    getSessionStatus
};