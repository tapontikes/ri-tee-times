const moment = require('moment');
const dbClient = require("../../../../database/client");

/**
 * Get the session status for a TeesNap domain
 * @param {Object} client - Axios client with cookie jar support
 * @param {string} id - The id of the course to check session for
 * @returns {Promise<Object>} Session status information
 */
async function getSession(client, id) {

    const course = await dbClient.getCourse(id);
    const cookies = client.defaults.jar.getCookiesSync(course.booking_url);

    const sessionCookie = cookies.find(cookie => cookie.key === 'laravel_session');
    const xsrfCookie = cookies.find(cookie => cookie.key === 'XSRF-TOKEN');

    if (!sessionCookie || !xsrfCookie) {
        return {
            isActive: false,
            expiresAt: null,
            id
        };
    }

    const expiryTime = moment(sessionCookie.expires);
    const now = moment();

    return {
        id,
        expiresAt: expiryTime.format(),
        expiresIn: expiryTime.diff(now, 'seconds')
    };
}

module.exports = {
    getSession: getSession
};