const logger = require('../../../utils/logger');
const {Unauthorized} = require('http-errors');

/**
 * Login to ForeUp
 * @param {Object} client - Axios client
 * @param {string} email - User email
 * @param {string} password - User password
 * @param bookingId
 * @returns {Promise<Object>} Login response data with JWT token
 */
async function login(client, email, password, bookingId) {
    const requestData = new URLSearchParams();

    requestData.append('username', email);
    requestData.append('password', password);
    requestData.append('api_key', 'no_limits');
    requestData.append('booking_class_id', " ");
    requestData.append('course_id', bookingId);

    try {
        const response = await client.post(
            'https://foreupsoftware.com/index.php/api/booking/users/login',
            requestData,
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'Accept': 'application/json, text/javascript, */*; q=0.01',
                    'X-Requested-With': 'XMLHttpRequest',
                    'API-Key': 'no_limits',
                    'X-FU-Golfer-Location': 'foreup',
                    'Host': 'foreupsoftware.com'
                }
            }
        );

        const jwt = response.data.jwt || response.data.token;
        if (!jwt) {
            logger.error(`ForeUp login succeeded but no JWT found in response. Keys: ${Object.keys(response.data).join(', ')}`);
            throw new Error('ForeUp login did not return a JWT token');
        }
        return jwt;

    } catch (error) {
        if (error.response) {
            logger.error(`ForeUp login failed with status ${error.response.status}: ${JSON.stringify(error.response.data)}`);
            if (error.response.status === 401) {
                throw new Unauthorized('Invalid credentials or unauthorized access');
            }
            throw new Error(`ForeUp login failed: ${error.response.status} ${JSON.stringify(error.response.data)}`);
        }
        throw error;
    }
}

/**
 * Get tee times from ForeUp
 * @param {Object} client - Axios client
 * @param {string} domain - The domain to fetch from
 * @param {Object} params - Parameters for the tee time search
 * @param {string} jwtToken - JWT token for authentication
 * @returns {Promise<Array>} Array of tee times
 */
async function getTeeTimes(client, domain, params, jwtToken) {
    logger.info(`Fetching tee times from ${domain}`);

    try {
        const response = await client.get(
            `https://${domain}/index.php/api/booking/times`,
            {
                params: {
                    ...params,
                    api_key: 'no_limits'
                },
                headers: {
                    'Accept': 'application/json, text/javascript, */*; q=0.01',
                    'X-Requested-With': 'XMLHttpRequest',
                    'API-Key': 'no_limits',
                    'X-FU-Golfer-Location': 'foreup',
                    'X-Authorization': `Bearer ${jwtToken}`
                }
            }
        );

        return response.data;
    } catch (error) {
        logger.error(`Failed to fetch tee times: ${error.message}`);

        // Check for 401 Unauthorized responses
        if (error.response && error.response.status === 401) {
            throw new Unauthorized('Session expired or invalid');
        }

        throw error;
    }
}

/**
 * Create a tee time reservation
 * @param {Object} client - Axios client
 * @param {string} domain - The domain for the reservation
 * @param {Object} reservationData - Reservation details
 * @param {string} jwtToken - JWT token for authentication
 * @returns {Promise<Object>} Reservation response
 */
async function createReservation(client, domain, reservationData, jwtToken) {
    logger.info(`Creating pending reservation on ${domain}`);

    try {
        const body = new URLSearchParams();
        body.append('time', reservationData.time);
        body.append('holes', String(reservationData.holes));
        body.append('players', String(reservationData.players));
        body.append('carts', String(reservationData.carts ?? false));
        body.append('schedule_id', String(reservationData.schedule_id));
        body.append('course_id', String(reservationData.course_id));
        body.append('booking_class_id', String(reservationData.booking_class_id));
        body.append('duration', String(reservationData.duration ?? 1));

        const response = await client.post(
            `https://${domain}/index.php/api/booking/pending_reservation`,
            body,
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'Accept': 'application/json, text/javascript, */*; q=0.01',
                    'X-Requested-With': 'XMLHttpRequest',
                    'API-Key': 'no_limits',
                    'X-FU-Golfer-Location': 'foreup',
                    'X-Authorization': `Bearer ${jwtToken}`
                }
            }
        );

        logger.info(`Pending reservation created: ${JSON.stringify(response.data)}`);
        return response.data;
    } catch (error) {
        if (error.response) {
            logger.error(`Reservation failed [${error.response.status}]: ${JSON.stringify(error.response.data)}`);
            if (error.response.status === 401) {
                throw new Unauthorized('Session expired or invalid');
            }
        } else {
            logger.error(`Reservation failed: ${error.message}`);
        }
        throw error;
    }
}

/**
 * Confirm a reservation
 * @param {Object} client - Axios client
 * @param {string} domain - The domain to confirm on
 * @param {string} reservationId - The ID of the reservation to confirm
 * @param {string} jwtToken - JWT token for authentication
 * @returns {Promise<Object>} Confirmation response data
 */
async function confirmReservation(client, domain, reservationId, jwtToken) {
    logger.info(`Confirming reservation ${reservationId} on ${domain}`);

    try {
        const response = await client.post(
            `https://${domain}/index.php/api/booking/confirm`,
            {id: reservationId},
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json, text/javascript, */*; q=0.01',
                    'X-Requested-With': 'XMLHttpRequest',
                    'API-Key': 'no_limits',
                    'X-FU-Golfer-Location': 'foreup',
                    'X-Authorization': `Bearer ${jwtToken}`
                }
            }
        );

        return response.data;
    } catch (error) {
        logger.error(`Confirmation failed: ${error.message}`);

        // Check for 401 Unauthorized responses
        if (error.response && error.response.status === 401) {
            throw new Unauthorized('Session expired or invalid');
        }

        throw error;
    }
}

module.exports = {
    login,
    getTeeTimes,
    createReservation,
    confirmReservation
};