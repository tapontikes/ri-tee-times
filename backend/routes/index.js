const express = require('express');
const router = express.Router();
const teeTimes = require('../service/teetime')

router.get('/courses', async (req, res) => {
    res.json(teeTimes.courses)
})

router.post('/foreup', async (req, res) => {

    const data = {
        "time": "all",
        "date": req.body.date,
        "holes": "all",
        "players": 0,
        "schedule_id": req.body.id,
        "api_key": "no_limits",
        "booking_class": req.body.booking_class
    }
    const times = await teeTimes.getForeUpTeeTimes(data)
    res.json(times);
});

router.post('/teesnap', async (req, res) => {

    const data = {
        "date": req.body.date,
        "holes": req.body.holes,
        "players": req.body.players,
        "course": req.body.course,
        "addons": "off",
    }
    const times = await teeTimes.getTeesnapTeeTimes(req.body.baseUrl, data)
    res.json(times);
});

router.post('/teeitup', async (req, res) => {

    const data = {
        "date": req.body.date,
        "course": req.body.course,
    }
    const times = await teeTimes.getTeeItUpTeeTimes(data, req.body.alias)
    res.json(times);
});

module.exports = router;




