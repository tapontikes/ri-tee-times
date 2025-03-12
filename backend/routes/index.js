const express = require('express');
const mcache = require('memory-cache');
const router = express.Router();
const courses = require('../service/courses')

const cache = (duration) => {
    return (req, res, next) => {
        let key = req.body.courseName + '__' + req.body.date;
        let cachedBody = mcache.get(key)
        if (cachedBody) {
            res.send(cachedBody)
        } else {
            res.sendResponse = res.send
            res.send = (body) => {
                mcache.put(key, body, duration * 1000);
                res.sendResponse(body)
            }
            next()
        }
    }
}
router.get('/', (req, res) => {
    res.send({"status": "ok"}).status(200);
});

router.post('/foreup', cache(300), async (req, res) => {

    const data = {
        "time": "all",
        "date": req.body.date,
        "holes": "all",
        "players": 0,
        "schedule_id": req.body.id,
        "api_key": "no_limits",
        "booking_class": req.body.booking_class
    }
    const times = await courses.getForeUpTeeTimes(data)
    res.json(times);
});

router.post('/teesnap', cache(300), async (req, res) => {

    const data = {
        "date": req.body.date,
        "holes": req.body.holes,
        "players": req.body.players,
        "course": req.body.course,
        "addons": "off",
    }
    const times = await courses.getTeeSnapTeeTimes(req.body.baseUrl, data)
    res.json(times);
});

router.post('/teeitup', cache(300), async (req, res) => {

    const data = {
        "date": req.body.date,
        "course": req.body.course,
    }
    const times = await courses.getTeeItUpTeeTimes(data, req.body.alias)
    res.json(times);
});

router.post('/teewire', cache(300), async (req, res) => {

    const data = {
        "formated": req.body.date,
        "cal_id": req.body.cal_id,
    }
    const params = {
        "controller": req.body.controller,
        "action": req.body.action,
        "cid": req.body.cid
    }

    const times = await courses.getTeeWireTeeTime(params, data, req.body.path)
    res.json(times);
});

module.exports = router;




