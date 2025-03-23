const moment = require('moment');
const jwt = require("jsonwebtoken");

/**
 * Create session status for a ForeUp course id
 * @param {Object} session - Express session object
 * @param _jwt
 * @param id
 * @returns {Promise<Object>} Session status information
 */
async function createSession(session, _jwt, id) {
    const decodedToken = jwt.decode(_jwt);
    const expiryTime = moment.unix(Number.parseInt(decodedToken.exp));
    const now = moment.now();


    const oldSession = session.foreupSessionData || {};
    const newSession = {
        id,
        expiresAt: expiryTime.format(),
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