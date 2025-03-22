const logger = require('../../../../utils/logger');
const {Unauthorized} = require("http-errors");

/**
 * Gets XSRF token from the Teesnap website
 * @param {Object} client - Axios client with cookie jar support
 * @param {string} domain - The domain to fetch from
 * @returns {Promise<string>} The decoded XSRF token
 */
async function getXSRFToken(client, domain) {
    logger.info(`Fetching XSRF token from ${domain}`);

    // Get the home page, this generates a XSRF token
    try {
        await client.get(domain, {
            withCredentials: true,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.8',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-GPC': '1',
                'Upgrade-Insecure-Requests': '1'
            }
        });

        // Extract token from cookies
        const cookies = client.defaults.jar.getCookiesSync(domain);
        logger.debug(`Cookies received: ${cookies.map(c => c.key).join(', ')}`);

        const xsrfCookie = cookies.find(cookie => cookie.key === 'XSRF-TOKEN');
        if (!xsrfCookie) {
            logger.error('XSRF-TOKEN cookie not found in cookies');
            throw new Error('XSRF-TOKEN cookie not found');
        }

        return decodeURIComponent(xsrfCookie.value);
    } catch (error) {
        logger.error(`Failed to get XSRF token: ${error.message}`);
        if (error.response) {
            logger.error(`Response status: ${error.response.status}`);
            logger.debug(`Response data: ${JSON.stringify(error.response.data).substring(0, 200)}...`);
        }
        throw error;
    }
}

/**
 * Login to Teesnap
 * @param {Object} client - Axios client with cookie jar support
 * @param {string} domain - The domain to login to
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} xsrfToken - The XSRF token
 * @returns {Promise<Object>} Login response data
 */
async function login(client, domain, email, password, xsrfToken) {
    logger.info(`Logging in to ${domain} with email: ${email}`);

    try {
        const response = await client.post(`${domain}/customer-api/login`,
            {email, password},
            {
                withCredentials: true,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
                    'Accept': 'application/json, text/plain, */*',
                    'Accept-Language': 'en-US,en;q=0.8',
                    'Content-Type': 'application/json;charset=UTF-8',
                    'Origin': `${domain}`,
                    'Referer': `${domain}/login`,
                    'X-XSRF-TOKEN': xsrfToken
                }
            }
        );

        logger.info(`Login successful for ${email}`);

        return response.data;
    } catch (error) {
        logger.error(`Login failed: ${error.message}`);
        throw error;
    }
}

/**
 * Get reservation quote
 * @param {Object} client - Axios client with cookie jar support
 * @param {string} domain - The domain to request from
 * @param {Object} reservationData - Reservation details
 * @returns {Promise<Object>} Reservation quote data
 */
async function getReservationQuote(client, domain, reservationData) {
    logger.info(`Requesting reservation quote on ${domain} for ${reservationData.teeTime}`);

    const xsrfToken = getXsrfTokenFromJar(client, domain);

    const teeTimeParams = `addons=${reservationData.addons}&course=${reservationData.courseId}&holes=${reservationData.holes}&players=${reservationData.players}&teeOffSection=${reservationData.teeOffSection}&teeTime=${reservationData.teeTime}`;

    try {
        const response = await client.post(
            `${domain}/customer-api/reservation-quote`,
            reservationData,
            {
                withCredentials: true,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
                    'Accept': 'application/json, text/plain, */*',
                    'Accept-Language': 'en-US,en;q=0.8',
                    'Content-Type': 'application/json;charset=UTF-8',
                    'Origin': `${domain}`,
                    'Referer': `${domain}/reservation?${teeTimeParams}`,
                    'X-XSRF-TOKEN': xsrfToken
                }
            }
        );

        logger.info(`Reservation quote successful for ${reservationData.teeTime}`);
        return response.data;
    } catch (error) {
        logger.error(`Reservation quote failed: ${error.message}`);
        throw error;
    }
}

/**
 * Confirm a reservation
 * @param {Object} client - Axios client with cookie jar support
 * @param {string} domain - The domain to request from
 * @param {string} reservationId - The ID of the reservation to confirm
 * @param {string} xsrfToken - The XSRF token
 * @returns {Promise<Object>} Confirmation response data
 */
async function confirmReservation(client, domain, reservationId, xsrfToken) {
    logger.info(`Confirming reservation ${reservationId} on ${domain}`);

    try {
        const response = await client.post(
            `${domain}/customer-api/reservations`,
            {id: reservationId},
            {
                withCredentials: true,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
                    'Accept': 'application/json, text/plain, */*',
                    'Content-Type': 'application/json;charset=UTF-8',
                    'Origin': `${domain}`,
                    'X-XSRF-TOKEN': xsrfToken
                }
            }
        );

        logger.info(`Reservation ${reservationId} confirmed successfully`);
        return response.data;

    } catch (error) {
        logger.error(`Confirmation failed: ${error.message}`);
        if (error.response) {
            logger.error(`Response status: ${error.response.status}`);
        }
        throw error;
    }
}

/**
 * Extract XSRF token from cookie jar
 * @param {Object} client - Axios client with cookie jar support
 * @param {string} domain - The domain to extract cookies from
 * @returns {string} The decoded XSRF token
 */
function getXsrfTokenFromJar(client, domain) {
    const cookies = client.defaults.jar.getCookiesSync(domain);
    const xsrfCookie = cookies.find(cookie => cookie.key === 'XSRF-TOKEN');

    if (!xsrfCookie) {
        throw new Unauthorized('XSRF-TOKEN cookie not found in cookie jar');
    }

    return decodeURIComponent(xsrfCookie.value);
}

module.exports = {
    getXSRFToken,
    login,
    getReservationQuote,
    confirmReservation
};