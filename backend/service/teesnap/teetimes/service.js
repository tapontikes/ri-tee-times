const axios = require('axios');
const logger = require('../../../utils/logger');
const {getRandomUserAgent} = require('../../../utils/user-agents');

// Constants
const TEESNAP_ENDPOINT = "/customer-api/teetimes-day";

/**
 * Fetches tee times from TeeSnap API
 * @returns {Promise<Array>} - Formatted tee times
 * @param date
 * @param booking_url
 * @param params
 */
async function getTeeSnapTeeTimes(date, booking_url, params) {
    try {

        const request_data = {
            "date": date,
            "addons": "off",
            "course": params.course,
        }

        const response = await axios.get(booking_url + TEESNAP_ENDPOINT, {
            headers: {
                'User-Agent': getRandomUserAgent()
            },
            params: request_data
        });

        const formattedTimes = [];
        const teeTimes = response.data.teeTimes;

        if (!teeTimes || !teeTimes.teeTimes || teeTimes.teeTimes.length === 0) {
            return formattedTimes;
        }

        // Build a bookingId → golfer count map for fast lookup
        const bookingGolferCount = {};
        (teeTimes.bookings ?? []).forEach(b => {
            bookingGolferCount[b.bookingId] = b.golfers.length;
        });

        teeTimes.teeTimes.forEach(time => {
            if (new Date(time.teeTime) < new Date()) return;

            // Evaluate each section independently
            const availableSections = [];

            for (const section of time.teeOffSections) {
                if (section.isHeld) continue;

                const golfersBooked = (section.bookings ?? [])
                    .reduce((sum, id) => sum + (bookingGolferCount[id] ?? 0), 0);

                const spots = 4 - golfersBooked;
                if (spots > 0) {
                    availableSections.push({teeOff: section.teeOff, spots});
                }
            }

            if (availableSections.length === 0) return;

            const maxSpots = Math.max(...availableSections.map(s => s.spots));

            const roundTypes = time.prices.map(p => p.roundType);
            const holes = [];
            if (roundTypes.includes('NINE_HOLE')) holes.push(9);
            if (roundTypes.includes('EIGHTEEN_HOLE')) holes.push(18);

            formattedTimes.push({
                time: time.teeTime,
                spots: maxSpots,
                start: availableSections.map(s => s.teeOff).join(','),
                holes,
            });
        });

        return formattedTimes;
    } catch (error) {
        if (error.response) {
            logger.error(`TeeSnap API error for ${booking_url}: HTTP ${error.response.status}`, error.response.data ?? '');
        } else {
            logger.error(`TeeSnap fetch error for ${booking_url}:`, error);
        }
        return [];
    }
}

module.exports = {
    getTeeSnapTeeTimes
};
