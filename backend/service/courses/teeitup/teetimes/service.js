const axios = require('axios');
const moment = require('moment');

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
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
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
        console.error("Error fetching TeeItUp tee times:", error.message);
        return [];
    }
}

module.exports = {
    getTeeItUpTeeTimes
};
