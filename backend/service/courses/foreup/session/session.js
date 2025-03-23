const moment = require('moment');
const jwt = require("jsonwebtoken");
const sessionService = require("./session");

/**
 * Create session status for a ForeUp domain
 * @param {Object} session - Express session object
 * @param _jwt
 * @param id
 * @returns {Promise<Object>} Session status information
 */
async function createSession(session, _jwt, id) {
    const decodedToken = jwt.decode(_jwt);
    const expiryTime = moment.unix(Number.parseInt(decodedToken.exp));
    const now = moment.now();
    const isActive = expiryTime.isAfter(now);


    const oldSession = session.foreupSessionData || {};  // Get existing session data or an empty object if not found

    const newSession = {
        isActive,
        expiresAt: expiryTime.format(),
        domain: id,
        expiresIn: expiryTime.diff(now, 'seconds'),
        jwt: _jwt
    };

    session.foreupSessionData = {
        ...oldSession,
        [id]: newSession
    };

    return session.foreupSessionData[id];
}

module.exports = {
    createSession
};