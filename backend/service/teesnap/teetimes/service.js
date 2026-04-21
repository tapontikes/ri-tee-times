const axios = require('axios');
const logger = require('../../../utils/logger');

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
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.6',
                'Priority': 'u=0, i',
                'Sec-CH-UA': '"Chromium";v="134", "Not:A-Brand";v="24", "Brave";v="134"',
                'Sec-CH-UA-Mobile': '?0',
                'Sec-CH-UA-Platform': '"Windows"',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Sec-GPC': '1',
                'Upgrade-Insecure-Requests': '1',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36'
            },
            params: request_data
        });

        const formattedTimes = [];
        const teeTimes = response.data.teeTimes;

        if (!teeTimes || teeTimes.length === 0) {
            return formattedTimes;
        }

        // Build a bookingId → golfer count map for fast lookup
        const bookingGolferCount = {};
        teeTimes.bookings.forEach(b => {
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
        logger.error("Error fetching TeeSnap tee times:", error.message);
        return [];
    }
}

module.exports = {
    getTeeSnapTeeTimes
};
