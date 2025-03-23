const logger = require('../../../../utils/logger');
const moment = require('moment');
const jwt = require("jsonwebtoken");
const sessionService = require("./session");

/**
 * Get session status for a ForeUp domain
 * @param {number} id - The name to check session for
 * @param {Object} session - Express session object
 * @returns {Promise<Object>} Session status information
 */
async function getSessionStatus(id, session) {
    const activeSession = session.foreupSessionData[id]
    if (!activeSession.jwt) {
        return {
            isActive: false,
            expiresAt: null,
            domain: id
        };
    }

    const decodedToken = jwt.decode(activeSession.jwt);
    const expiryTime = moment.unix(Number.parseInt(decodedToken.exp));
    const now = moment.now();
    const isActive = expiryTime.isAfter(now);

    session.foreupSessionData[id] = {
        isActive,
        expiresAt: expiryTime.format(),
        domain: id,
        expiresIn: expiryTime.diff(now, 'seconds'),
        jwt: activeSession.jwt
    };
    return session.foreupSessionData[id];
}

module.exports = {
    getSessionStatus
};