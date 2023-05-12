const axios = require('axios');
const moment = require('moment');
const cheerio = require('cheerio');

// the URL of the JSON API endpoint
const forupBaseUrl = "https://app.foreupsoftware.com/index.php/api/booking/times"
const teeItUpBaseUrl = "https://phx-api-be-east-1b.kenna.io/v2/tee-times";
const teeWireBaseUrl = "https://teewire.net";
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
                    if (!time.rates.find(rate => rate.hasOwnProperty("dueOnlineRiding"))) return;
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

async function getTeeSnapTeeTimes(url, params) {
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

async function getTeeWireTeeTime(params, data, path) {
    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: teeWireBaseUrl + path,
        params: params,
        timeout: 5000,
        headers: {
            'Accept': '*/*',
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
            'Sec-GPC': '1',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36',
            'X-Requested-With': 'XMLHttpRequest',
            'sec-ch-ua': '"Brave";v="113", "Chromium";v="113", "Not-A.Brand";v="24"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
        },
        data: data
    };

    return axios.request(config)
        .then((response) => {

            const formattedTimes = [];
            const html = response.data;
            const $ = cheerio.load(html);

            $('body > div').each((i, el) => {
                try {
                    const time = $(el).find('.panel-title').first().text().trim();
                    const spots = $(el).find('.panel-body').text().trim().match(/Up to (\d+) golfers/)[1];
                    let holes = $(el).find('.panel-footer').text().trim();
                    holes = holes.match(/(9|18)/)[0];
                    formattedTimes.push({
                        "time": moment(time, 'h:mm A').format('h:mm A'),
                        "holes": holes,
                        "spots": spots
                    })
                } catch (ex) {
                    return [];
                }
            });
            return formattedTimes;
        })
        .catch((error) => {
            console.log(error);
        });
}

module.exports = {
    getForeUpTeeTimes,
    getTeeSnapTeeTimes,
    getTeeItUpTeeTimes,
    getTeeWireTeeTime
}
