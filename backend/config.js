module.exports = {
    // Database configuration
    database: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: false
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
            "type": "foreup",
            "address": "69 Burlingame Rd, Cranston, RI 02921"

        },
        {
            "id": 2,
            "name": "Louisquisset Golf Club",
            "requestData": {
                "alias": "louisquisset-golf-club",
                "facilityIds": 11490
            },
            "bookingUrl": "https://louisquisset-golf-club.book.teeitup.com/",
            "type": "teeitup",
            "address": "1 Overlook Cir, North Providence, RI 02904"
        },
        {
            "id": 3,
            "name": "Connecticut National",
            "requestData": {
                "alias": "connecticut-national-golf-club",
                "facilityIds": 5166
            },
            "bookingUrl": "https://connecticut-national-golf-club.book.teeitup.com/",
            "type": "teeitup",
            "address": "136 Chase Rd, Putnam, CT 06260"
        },
        {
            "id": 4,
            "name": "Foster Country Club",
            "requestData": {
                "id": 6496,
                "booking_class": 7851
            },
            "bookingUrl": "https://foreupsoftware.com/index.php/booking/21021/6496#teetimes",
            "type": "foreup",
            "address": "67 Johnson Rd, Foster, RI 02825"
        },
        {
            "id": 5,
            "name": "Triggs",
            "requestData": {
                "id": 1457,
                "booking_class": 1029
            },
            "bookingUrl": "https://foreupsoftware.com/index.php/booking/index/19339#/teetimes",
            "type": "foreup",
            "address": "1533 Chalkstone Ave, Providence, RI 02909"
        },
        {
            "id": 6,
            "name": "North Kingstown Golf Course",
            "requestData": {
                "id": 10204,
                "booking_class": 13839
            },
            "bookingUrl": "https://foreupsoftware.com/index.php/booking/22236/10204#/teetimes",
            "type": "foreup",
            "address": "615 Callahan Rd, North Kingstown, RI 02852"
        },
        {
            "id": 7,
            "name": "Crystal Lake",
            "requestData": {
                "baseUrl": "https://crystallakegc.teesnap.net",
                "course": 1323
            },
            "bookingUrl": "https://crystallakegc.teesnap.net",
            "type": "teesnap",
            "address": "100 Broncos Hwy, Mapleville, RI 02839"
        },
        {
            "id": 8,
            "name": "Stone E. Lee",
            "requestData": {
                "baseUrl": "https://stoneeleagc.teesnap.net",
                "course": 1312
            },
            "bookingUrl": "https://stoneeleagc.teesnap.net",
            "type": "teesnap",
            "address": "1411 County St, Attleboro, MA 02703"
        },
        {
            "id": 9,
            "name": "Country View",
            "requestData": {
                "baseUrl": "https://countryviewgolf.teesnap.net",
                "course": 413
            },
            "bookingUrl": "https://countryviewgolf.teesnap.net",
            "type": "teesnap",
            "address": "49 Club Ln, Harrisville, RI 02830"
        },
        {
            "id": 10,
            "name": "Laurel Lane",
            "requestData": {
                "baseUrl": "https://laurellanecountryclub.teesnap.net",
                "course": 446
            },
            "bookingUrl": "https://laurellanecountryclub.teesnap.net",
            "type": "teesnap",
            "address": "309 Laurel Ln, West Kingston, RI 02892"
        },
        {
            "id": 11,
            "name": "Fenner Hill",
            "requestData": {
                "baseUrl": "https://fennerhill.teesnap.net",
                "course": 1103
            },
            "bookingUrl": "https://fennerhill.teesnap.net",
            "type": "teesnap",
            "address": "33 Wheeler Ln, Hope Valley, RI 02832"
        },
        {
            "id": 12,
            "name": "Melody Hill",
            "requestData": {
                "baseUrl": "https://melodyhillcc.teesnap.net",
                "course": 466
            },
            "bookingUrl": "https://melodyhillcc.teesnap.net",
            "type": "teesnap",
            "address": "55 Melody Hill CC Rd #2238, Chepachet, RI 02814"
        },
        {
            "id": 13,
            "name": "Midville Country Club",
            "requestData": {
                "controller": "GzFront",
                "action": "getTimeSlot",
                "cid": "1",
                "cal_id": "1",
                "path": "/midville/teetimes/load.php"
            },
            "bookingUrl": "https://teewire.net/midville",
            "type": "teewire",
            "address": "100 Lombardi Ln, West Warwick, RI 02893",
        },
        {
            "id": 14,
            "name": "Met Links",
            "requestData": {
                "id": 11966,
                "booking_class": 50955
            },
            "bookingUrl": "https://foreupsoftware.com/index.php/booking/22800/11966#teetimes",
            "type": "foreup",
            "address": "500 Veterans Memorial Pkwy, East Providence, RI 02914"
        },
    ]
}
