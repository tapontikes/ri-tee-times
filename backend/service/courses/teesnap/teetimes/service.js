const axios = require('axios');
const moment = require('moment');

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

        const bookingsArr = teeTimes.bookings;

        teeTimes.teeTimes.forEach(time => {
            const bookingCheck = time.teeOffSections[0];

            // Skip times that are in the past
            if (moment(time.teeTime).isBefore(moment.now())) {
                return;
            }

            let teeTimeObj = {};

            if (typeof bookingCheck.bookings === 'undefined' && bookingCheck.isHeld === false) {
                // Available tee time with no bookings
                teeTimeObj.time = time.teeTime;
                teeTimeObj.spots = 4;
            } else if (bookingCheck.bookings && bookingCheck.bookings.length > 0) {
                // Tee time with some bookings
                let bookingCounter = 0;
                let totalBookings = [];

                bookingCheck.bookings.forEach((booking) => {
                    bookingsArr.forEach(allBookings => {
                        if (allBookings.bookingId === booking) {
                            totalBookings.push(allBookings);
                        }
                    });
                });

                totalBookings.forEach(booking => {
                    bookingCounter += booking.golfers.length;
                });

                // Skip fully booked tee times
                if (bookingCounter === 4) {
                    return;
                }

                teeTimeObj.time = time.teeTime;
                teeTimeObj.spots = 4 - bookingCounter;
            } else {
                // Skip held tee times or other unavailable times
                return;
            }

            teeTimeObj.start = time.teeOffSections[0].teeOff;

            // Determine available hole options
            const roundTypes = time.prices.map(item => item.roundType);
            teeTimeObj.holes = [];

            if (roundTypes.includes('NINE_HOLE')) {
                teeTimeObj.holes.push(9);
            }
            if (roundTypes.includes('EIGHTEEN_HOLE')) {
                teeTimeObj.holes.push(18);
            }

            formattedTimes.push(teeTimeObj);
        });

        return formattedTimes;
    } catch (error) {
        console.error("Error fetching TeeSnap tee times:", error.message);
        return [];
    }
}

module.exports = {
    getTeeSnapTeeTimes
};
