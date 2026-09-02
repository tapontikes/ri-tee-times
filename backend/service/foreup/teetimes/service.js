const axios = require('axios');
const logger = require('../../../utils/logger');
const {getRandomUserAgent} = require('../../../utils/user-agents');

// Constants
const FOREUP_BASE_URL = "https://app.foreupsoftware.com/index.php/api/booking/times";

/**
 * Fetches tee times from ForeUp API
 * @param date
 * @param {Object} params - Query parameters for the API request
 * @returns {Promise<Array>} - Formatted tee times
 */
async function getForeUpTeeTimes(date, params) {
    try {
        const request_data = {
            "time": "all",
            "date": date,
            "holes": "all",
            "players": 0,
            "schedule_id": params.id,
            "api_key": "no_limits",
            "booking_class": params.booking_class
        }

        const response = await axios.get(FOREUP_BASE_URL, {
            headers: {
                'User-Agent': getRandomUserAgent()
            },
            params: request_data
        });

        const formattedTimes = [];
        const data = response.data;

        if (!data) {
            return formattedTimes;
        }

        data.forEach((teeTime) => {
            formattedTimes.push({
                "time": teeTime.time,
                "holes": typeof teeTime.holes === "string"
                    ? teeTime.holes.toString().split('/').map(Number)
                    : [teeTime.holes],
                "start": teeTime.teesheet_side_name,
                "spots": teeTime.available_spots
            });
        });

        return formattedTimes;
    } catch (error) {
        if (error.response) {
            logger.error(`ForeUp API error: HTTP ${error.response.status}`, error.response.data ?? '');
        } else {
            logger.error('ForeUp fetch error:', error);
        }
        return [];
    }
}

module.exports = {
    getForeUpTeeTimes
};
