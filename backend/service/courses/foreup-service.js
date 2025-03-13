const axios = require('axios');
const moment = require('moment');

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
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
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
        console.error("Error fetching ForeUp tee times:", error.message);
        return [];
    }
}

module.exports = {
    getForeUpTeeTimes
};
