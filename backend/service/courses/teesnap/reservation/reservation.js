const logger = require('../../../..//utils/logger');

/**
 * Gets CSRF token from the Teesnap website
 * @param {Object} client - Axios client with cookie jar support
 * @param {string} domain - The domain to fetch from
 * @returns {Promise<string>} The decoded XSRF token
 */
async function getCSRFToken(client, domain) {
    logger.info(`Fetching CSRF token from ${domain}`);

    try {
        const response = await client.get(`https://${domain}.teesnap.net/`, {
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

        logger.debug(`Initial page fetch status: ${response.status}`);

        // Extract token
        const cookies = client.defaults.jar.getCookiesSync(`https://${domain}.teesnap.net/`);
        logger.debug(`Cookies received: ${cookies.map(c => c.key).join(', ')}`);

        const xsrfCookie = cookies.find(cookie => cookie.key === 'XSRF-TOKEN');
        if (!xsrfCookie) {
            logger.error('XSRF-TOKEN cookie not found in cookies');
            throw new Error('XSRF-TOKEN cookie not found');
        }

        const token = decodeURIComponent(xsrfCookie.value);
        logger.debug(`XSRF token extracted (first 20 chars): ${token.substring(0, 20)}...`);

        return token;
    } catch (error) {
        logger.error(`Failed to get CSRF token: ${error.message}`);
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
        const response = await client.post(`https://${domain}.teesnap.net/customer-api/login`,
            { email, password },
            {
                withCredentials: true,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
                    'Accept': 'application/json, text/plain, */*',
                    'Accept-Language': 'en-US,en;q=0.8',
                    'Content-Type': 'application/json;charset=UTF-8',
                    'Origin': `https://${domain}.teesnap.net`,
                    'Referer': `https://${domain}.teesnap.net/login`,
                    'X-XSRF-TOKEN': xsrfToken
                }
            }
        );

        logger.debug(`Login status: ${response.status}`);
        logger.info(`Login successful for ${email}`);

        return response.data;
    } catch (error) {
        logger.error(`Login failed: ${error.message}`);
        if (error.response) {
            logger.error(`Response status: ${error.response.status}`);
            logger.debug(`Response data: ${JSON.stringify(error.response.data).substring(0, 200)}...`);
        }
        throw error;
    }
}

/**
 * Get reservation quote
 * @param {Object} client - Axios client with cookie jar support
 * @param {string} domain - The domain to request from
 * @param {Object} reservationData - Reservation details
 * @param {string} xsrfToken - The XSRF token
 * @returns {Promise<Object>} Reservation quote data
 */
async function getReservationQuote(client, domain, reservationData, xsrfToken) {
    logger.info(`Requesting reservation quote on ${domain} for ${reservationData.teeTime}`);

    const teeTimeParams = `addons=${reservationData.addons}&course=${reservationData.courseId}&holes=${reservationData.holes}&players=${reservationData.players}&teeOffSection=${reservationData.teeOffSection}&teeTime=${reservationData.teeTime}`;

    try {
        const response = await client.post(
            `https://${domain}.teesnap.net/customer-api/reservation-quote`,
            reservationData,
            {
                withCredentials: true,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
                    'Accept': 'application/json, text/plain, */*',
                    'Accept-Language': 'en-US,en;q=0.8',
                    'Content-Type': 'application/json;charset=UTF-8',
                    'Origin': `https://${domain}.teesnap.net`,
                    'Referer': `https://${domain}.teesnap.net/reservation?${teeTimeParams}`,
                    'X-XSRF-TOKEN': xsrfToken
                }
            }
        );

        logger.debug(`Reservation quote status: ${response.status}`);
        logger.info(`Reservation quote successful for ${reservationData.teeTime}`);

        return response.data;
    } catch (error) {
        logger.error(`Reservation quote failed: ${error.message}`);

        if (error.response) {
            logger.error(`Response status: ${error.response.status}`);

            if (error.response.status === 422) {
                logger.error('Validation error (422) - likely reasons:');
                logger.error('  - The requested tee time may not be available');
                logger.error('  - The course could be closed on the requested date');
                logger.error('  - The player count or holes count could be invalid');

                if (error.response.data && error.response.data.errors) {
                    logger.error(`Specific error code: ${JSON.stringify(error.response.data.errors)}`);
                }
            }

            logger.debug(`Response data: ${JSON.stringify(error.response.data)}`);
            logger.debug(`Request URL: ${error.config.url}`);
            logger.debug(`Request data: ${error.config.data}`);
        }

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
            `https://${domain}.teesnap.net/customer-api/reservations`,
            { id: reservationId },
            {
                withCredentials: true,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
                    'Accept': 'application/json, text/plain, */*',
                    'Content-Type': 'application/json;charset=UTF-8',
                    'Origin': `https://${domain}.teesnap.net`,
                    'X-XSRF-TOKEN': xsrfToken
                }
            }
        );

        logger.debug(`Confirmation status: ${response.status}`);
        logger.info(`Reservation ${reservationId} confirmed successfully`);

        return response.data;
    } catch (error) {
        logger.error(`Confirmation failed: ${error.message}`);
        if (error.response) {
            logger.error(`Response status: ${error.response.status}`);
            logger.debug(`Response data: ${JSON.stringify(error.response.data)}`);
        }
        throw error;
    }
}

/**
 * Complete Teesnap flow: Get token, login, and get reservation quote
 * @param {Object} client - Axios client with cookie jar support
 * @param {string} domain - The teesnap domain (e.g., 'laurellanecountryclub')
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {Object} reservationData - Reservation details
 * @returns {Promise<Object>} Results of the flow
 */
async function completeTeesnapFlow(client, domain, email, password, reservationData) {
    logger.info(`Starting complete Teesnap flow for ${domain}`);

    try {
        // Get CSRF token
        const initialToken = await getCSRFToken(client, domain);
        logger.info('Initial XSRF token obtained');

        // Login
        const loginData = await login(client, domain, email, password, initialToken);
        logger.info('Login successful');

        // Get updated token after login
        const updatedCookies = client.defaults.jar.getCookiesSync(`https://${domain}.teesnap.net/`);
        logger.debug(`Cookies after login: ${updatedCookies.map(c => c.key).join(', ')}`);

        const updatedXsrfCookie = updatedCookies.find(cookie => cookie.key === 'XSRF-TOKEN');

        if (!updatedXsrfCookie) {
            logger.error('Updated XSRF-TOKEN cookie not found after login');
            throw new Error('Updated XSRF-TOKEN cookie not found after login');
        }

        const updatedToken = decodeURIComponent(updatedXsrfCookie.value);
        logger.debug(`Updated XSRF token obtained (first 20 chars): ${updatedToken.substring(0, 20)}...`);

        // Get reservation quote
        const quoteData = await getReservationQuote(client, domain, reservationData, updatedToken);
        logger.info('Reservation quote obtained successfully');

        return {
            loginData,
            quoteData,
            token: updatedToken
        };
    } catch (error) {
        logger.error(`Complete Teesnap flow failed: ${error.message}`);
        throw error;
    }
}

module.exports = {
    getCSRFToken,
    login,
    getReservationQuote,
    confirmReservation,
    completeTeesnapFlow
};