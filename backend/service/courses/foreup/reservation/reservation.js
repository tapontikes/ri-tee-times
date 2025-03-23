const logger = require('../../../../utils/logger');
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
    let response;
    try {
        const requestData = new URLSearchParams();

        requestData.append('username', email);
        requestData.append('password', password);
        requestData.append('api_key', 'no_limits');
        requestData.append('booking_class_id', " ");
        requestData.append('course_id', bookingId);

        response = await client.post(
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

    } catch (error) {
        if (error.response.status === 401) {
            throw new Unauthorized('Invalid credentials or unauthorized access');
        }
    }
    return response.data.jwt
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
    logger.info(`Creating reservation on ${domain}`);

    try {
        const response = await client.post(
            `https://${domain}/index.php/api/booking/reservation`,
            reservationData,
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
        logger.error(`Reservation failed: ${error.message}`);

        // Check for 401 Unauthorized responses
        if (error.response && error.response.status === 401) {
            throw new Unauthorized('Session expired or invalid');
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