const axios = require('axios');
const moment = require('moment');

teeTimesMappedArr = [];

courses = [
    {
        "name": "Cranston Country Club",
        "requestData": {
            "id": 10153,
            "booking_class": 13646,
        },
        "bookingUrl": "https://foreupsoftware.com/index.php/booking/22225/10153#teetimes",
        "type": "foreup"
    },
    {
        "name": "Louisquisset Golf Club",
        "requestData": {
            "alias": "louisquisset-golf-club",
            "facilityIds": 11490,
        },
        "bookingUrl": "https://louisquisset-golf-club.book.teeitup.com/",
        "type": "teeitup"
    },
    {
        "name": "Green Valley Country Club",
        "requestData": {
            "alias": "green-valley-country-club1",
            "facilityIds": 12910,
        },
        "bookingUrl": "https://green-valley-country-club1.book.teeitup.golf",
        "type": "teeitup"
    },
    {
        "name": "Foster Country Club",
        "requestData": {
            "id": 6496,
            "booking_class": 7851,
        },
        "bookingUrl": "https://foreupsoftware.com/index.php/booking/21021/6496#teetimes",
        "type": "foreup"
    },
    {
        "name": "Triggs",
        "requestData": {
            "id": 1457,
            "booking_class": 1029,
        },
        "bookingUrl": "https://app.foreupsoftware.com/index.php/booking/19339/1457#teetimes",
        "type": "foreup"
    },
    {
        "name": "North Kingstown Golf Course",
        "requestData": {
            "id": 10204,
            "booking_class": 13839,
        },
        "bookingUrl": "https://foreupsoftware.com/index.php/booking/22236/10204#/teetimes",
        "type": "foreup"
    },
    {
        "name": "Crystal Lake",
        "requestData": {
            "baseUrl": "https://crystallakegc.teesnap.net",
            "course": 1323
        },
        "bookingUrl": "https://crystallakegc.teesnap.net",
        "type": "teesnap"
    },
    {
        "name": "Country View",
        "requestData": {
            "baseUrl": "https://countryviewgolf.teesnap.net",
            "course": 413
        },
        "bookingUrl": "https://countryviewgolf.teesnap.net",
        "type": "teesnap"
    },
    {
        "name": "Laurel Lane",
        "requestData": {
            "baseUrl": "https://laurellanecountryclub.teesnap.net",
            "course": 446
        },
        "bookingUrl": "https://laurellanecountryclub.teesnap.net",
        "type": "teesnap"
    },
    {
        "name": "Fenner Hill",
        "requestData": {
            "baseUrl": " https://fennerhill.teesnap.net",
            "course": 1103
        },
        "bookingUrl": " https://fennerhill.teesnap.net",
        "type": "teesnap"
    },

]

// the URL of the JSON API endpoint
const forupBaseUrl = "https://app.foreupsoftware.com/index.php/api/booking/times"
const teeItUpBaseUrl = "https://phx-api-be-east-1b.kenna.io/v2/tee-times";
const teesnapEndpoint = "/customer-api/teetimes-day";

async function getForeUpTeeTimes(params) {
    return await axios.get(forupBaseUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
        },
        params: params
    })
        .then((response) => {
            const formattedTimes = []
            let data = response.data;
            if (data) {
                data.map((teeTimes) => {
                    formattedTimes.push({
                        "time": moment(teeTimes.time).format('h:mm A'),
                        "holes": typeof teeTimes.holes == "string" ? teeTimes.holes.toString().split('/').map(Number) : [teeTimes.holes],
                        "start": teeTimes.teesheet_side_name,
                        "spots": teeTimes.available_spots
                    })
                })
                return formattedTimes;
            }
        }).catch(err => {
            console.log(err);
        });

}

async function getTeeItUpTeeTimes(params, alias) {
    return axios.get(teeItUpBaseUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
            'x-be-alias': alias
        },
        params: params
    })
        .then((response) => {
            const formattedTimes = []
            let data = response.data
            if (data) {
                data[0].teetimes.forEach((time => {
                    formattedTimes.push({
                        "time": moment(time.teetime).format('h:mm A'),
                        "holes": [18, 9].filter(holes => time.rates.find(rate => rate.holes === holes)),
                        "spots": 4 - time.bookedPlayers
                    })
                }))
            }
            return formattedTimes;
        }).catch(err => {
            console.log(err);
        });

}

async function getTeesnapTeeTimes(url, params) {
    return axios.get(url + teesnapEndpoint, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
        },
        params: params
    })
        .then((response) => {
            const formattedTimes = []
            let data = response.data;
            if (data) {
                let bookingsArr = data.teeTimes.bookings;
                data.teeTimes.teeTimes.forEach(time => {
                    let bookingCheck = time.teeOffSections[0];
                    if (moment(time.teeTime).isBefore(moment.now())) {
                        return;
                    }

                    let teeTimeObj = {}

                    if (typeof bookingCheck.bookings === 'undefined' && bookingCheck.isHeld === false) {
                        teeTimeObj.time = moment(time.teeTime).format('h:mm A');
                        teeTimeObj.spots = 4;
                    } else if (bookingCheck.bookings.length > 0) {
                        let bookingCounter = 0;
                        let totalBookings = [];
                        bookingCheck.bookings.forEach((booking => {
                            bookingsArr.forEach(allBookings => {
                                if (allBookings.bookingId === booking) {
                                    totalBookings.push(allBookings);
                                }
                            })
                        }))

                        totalBookings.forEach(booking => {
                            bookingCounter += booking.golfers.length;
                        })

                        if (bookingCounter === 4) return;

                        teeTimeObj.time = moment(time.teeTime).format('h:mm A');
                        teeTimeObj.spots = 4 - bookingCounter;
                    }

                    const roundTypes = time.prices.map(item => item.roundType);

                    teeTimeObj.holes = [];

                    if (roundTypes.includes('NINE_HOLE')) {
                        teeTimeObj.holes.push(9);
                    }
                    if (roundTypes.includes('EIGHTEEN_HOLE')) {
                        teeTimeObj.holes.push(18);
                    }

                    formattedTimes.push(teeTimeObj)
                })
            }
            return formattedTimes;
        }).catch(err => {
            console.log(err);
        });

}


module.exports = {
    getForeUpTeeTimes,
    getTeesnapTeeTimes,
    getTeeItUpTeeTimes,
    "courses": courses
}
