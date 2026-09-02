const axios = require('axios');
const logger = require('../../../utils/logger');
const {getRandomUserAgent} = require('../../../utils/user-agents');

// Constants
const TEEITUP_BASE_URL = "https://phx-api-be-east-1b.kenna.io/v2/tee-times";

/**
 * Fetches tee times from TeeItUp API
 * @param date
 * @param {Object} params - Query parameters for the API request
 * @returns {Promise<Array>} - Formatted tee times
 */
async function getTeeItUpTeeTimes(date, params) {
    try {

        const request_data = {
            "date": date,
            "facilityIds": params.facilityIds,
        }

        const response = await axios.get(TEEITUP_BASE_URL, {
            headers: {
                'User-Agent': getRandomUserAgent(),
                'x-be-alias': params.alias
            },
            params: request_data
        });

        const formattedTimes = [];
        const data = response.data;

        if (!data || !data[0] || !data[0].teetimes) {
            return formattedTimes;
        }

        data[0].teetimes.forEach((time) => {
            // Skip times that don't have riding rates
            if (!time.rates.find(rate => rate.hasOwnProperty("dueOnlineRiding"))) {
                return;
            }

            formattedTimes.push({
                "time": time.teetime,
                "holes": [18, 9].filter(holes => time.rates.find(rate => rate.holes === holes)),
                "spots": 4 - time.bookedPlayers
            });
        });

        return formattedTimes;
    } catch (error) {
        if (error.response) {
            logger.error(`TeeItUp API error: HTTP ${error.response.status}`, error.response.data ?? '');
        } else {
            logger.error('TeeItUp fetch error:', error);
        }
        return [];
    }
}

module.exports = {
    getTeeItUpTeeTimes
};
