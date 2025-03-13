require('dotenv').config({path: require('path').resolve(__dirname, './.env')});

module.exports = {
    // Database configuration
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        user: process.env.DB_USER || 'user',
        password: process.env.DB_PASSWORD || 'password',
        database: process.env.DB_NAME || 'tee_times_pg',
        ssl: process.env.DB_SSL === 'true' ? {rejectUnauthorized: false} : false
    },

    // API configurations
    apis: {
        foreUp: {
            // Add any specific ForeUp API configuration here
            cronSchedule: process.env.FOREUP_CRON || '0 */6 * * *'  // Default: every 6 hours
        },
        teeItUp: {
            // Add any specific TeeItUp API configuration here
            cronSchedule: process.env.TEEITUP_CRON || '0 */6 * * *'  // Default: every 6 hours
        },
        teeSnap: {
            // Add any specific TeeSnap API configuration here
            cronSchedule: process.env.TEESNAP_CRON || '0 */6 * * *'  // Default: every 6 hours
        },
        teeWire: {
            // Add any specific TeeWire API configuration here
            cronSchedule: process.env.TEEWIRE_CRON || '0 */6 * * *'  // Default: every 6 hours
        }
    },

    courses: [
        {
            "id": 1,
            "name": "Cranston Country Club",
            "requestData": {
                "id": 10153,
                "booking_class": 13646
            },
            "bookingUrl": "https://foreupsoftware.com/index.php/booking/22225/10153#teetimes",
            "type": "foreup"
        },
        {
            "id": 2,
            "name": "Louisquisset Golf Club",
            "requestData": {
                "alias": "louisquisset-golf-club",
                "facilityIds": 11490
            },
            "bookingUrl": "https://louisquisset-golf-club.book.teeitup.com/",
            "type": "teeitup"
        },
        {
            "id": 3,
            "name": "Connecticut National",
            "requestData": {
                "alias": "connecticut-national-golf-club",
                "facilityIds": 5166
            },
            "bookingUrl": "https://connecticut-national-golf-club.book.teeitup.com/",
            "type": "teeitup"
        },
        {
            "id": 4,
            "name": "Green Valley Country Club",
            "requestData": {
                "alias": "green-valley-country-club1",
                "facilityIds": 12910
            },
            "bookingUrl": "https://green-valley-country-club1.book.teeitup.golf",
            "type": "teeitup"
        },
        {
            "id": 5,
            "name": "Foster Country Club",
            "requestData": {
                "id": 6496,
                "booking_class": 7851
            },
            "bookingUrl": "https://foreupsoftware.com/index.php/booking/21021/6496#teetimes",
            "type": "foreup"
        },
        {
            "id": 6,
            "name": "Triggs",
            "requestData": {
                "id": 1457,
                "booking_class": 1029
            },
            "bookingUrl": "https://app.foreupsoftware.com/index.php/booking/19339/1457#teetimes",
            "type": "foreup"
        },
        {
            "id": 7,
            "name": "North Kingstown Golf Course",
            "requestData": {
                "id": 10204,
                "booking_class": 13839
            },
            "bookingUrl": "https://foreupsoftware.com/index.php/booking/22236/10204#/teetimes",
            "type": "foreup"
        },
        {
            "id": 8,
            "name": "Crystal Lake",
            "requestData": {
                "baseUrl": "https://crystallakegc.teesnap.net",
                "course": 1323
            },
            "bookingUrl": "https://crystallakegc.teesnap.net",
            "type": "teesnap"
        },
        {
            "id": 9,
            "name": "Stone E. Lee",
            "requestData": {
                "baseUrl": "https://stoneeleagc.teesnap.net",
                "course": 1312
            },
            "bookingUrl": "https://stoneeleagc.teesnap.net",
            "type": "teesnap"
        },
        {
            "id": 10,
            "name": "Country View",
            "requestData": {
                "baseUrl": "https://countryviewgolf.teesnap.net",
                "course": 413
            },
            "bookingUrl": "https://countryviewgolf.teesnap.net",
            "type": "teesnap"
        },
        {
            "id": 11,
            "name": "Laurel Lane",
            "requestData": {
                "baseUrl": "https://laurellanecountryclub.teesnap.net",
                "course": 446
            },
            "bookingUrl": "https://laurellanecountryclub.teesnap.net",
            "type": "teesnap"
        },
        {
            "id": 12,
            "name": "Fenner Hill",
            "requestData": {
                "baseUrl": "https://fennerhill.teesnap.net",
                "course": 1103
            },
            "bookingUrl": "https://fennerhill.teesnap.net",
            "type": "teesnap"
        },
        {
            "id": 13,
            "name": "Melody Hill",
            "requestData": {
                "baseUrl": "https://melodyhillcc.teesnap.net",
                "course": 466
            },
            "bookingUrl": "https://melodyhillcc.teesnap.net",
            "type": "teesnap"
        },
        {
            "id": 14,
            "name": "Midville Country Club",
            "requestData": {
                "controller": "GzFront",
                "action": "getTimeSlot",
                "cid": "1",
                "cal_id": "1",
                "path": "/midville/teetimes/load.php"
            },
            "bookingUrl": "https://teewire.net/midville",
            "type": "teewire"
        }
    ]
}
