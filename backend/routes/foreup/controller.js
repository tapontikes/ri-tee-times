const express = require('express');
const {Unauthorized} = require("http-errors");
const foreupService = require('../../service/courses/foreup/reservation/reservation');
const sessionService = require('../../service/courses/foreup/session/session');
const moment = require('moment');

const router = express.Router();

/**
 * Endpoint to login to ForeUp
 */
router.post('/login', async (req, res) => {
    let {email, password, courseId, courseName, id} = req.body;
    id = Number.parseInt(id);

    // Validate required parameters
    if (!email || !password || !courseId || !courseName || !id) {
        return res.status(400).json({
            success: false,
            error: 'Missing required parameters for login'
        });
    }

    try {
        const jwt = await foreupService.login(
            req.axiosClient,
            email,
            password,
            courseId
        );
        const session = await sessionService.createSession(req.session, jwt, id);
        res.json(session);

    } catch (error) {
        if (error instanceof Unauthorized) {
            return res.status(401).send();
        }
        res.status(500).json({
            success: false,
            error: error.message,
            responseData: error.response ? error.response.data : null
        });
    }
});

/**
 * Endpoint to reserve a tee time
 */
router.post('/reserve', async (req, res) => {
    try {
        const {id, reservationData} = req.body;

        if (!id || !reservationData) {
            return res.status(400).json({
                success: false,
                error: 'Missing domain or reservation data'
            });
        }

        // Check if we have a session for this domain
        if (!req.session.foreupSessionData[id] || !req.session.foreupSessionData[id].jwt) {
            return res.status(401).json({
                success: false,
                error: 'No active session found for this domain'
            });
        }

        // Get the JWT token from the session
        const jwtToken = req.session[id].jwt;

        // Create the reservation
        const reservationResponse = await foreupService.createReservation(
            req.axiosClient,
            id,
            reservationData,
            jwtToken
        );

        // Store the reservation ID in the session
        req.session[domain].reservationId = reservationResponse.id || reservationResponse.reservation_id;

        res.json({
            success: true,
            reservationQuote: reservationResponse
        });
    } catch (error) {
        if (error instanceof Unauthorized) {
            res.status(401).json({
                success: false,
                error: 'Session expired or invalid'
            });
        } else {
            console.error('Error processing reservation:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                responseData: error.response ? error.response.data : null
            });
        }
    }
});

/**
 * Endpoint to confirm the reservation
 */
router.post('/confirm', async (req, res) => {
    try {
        const {domain, reservationId} = req.body;

        // Verify we have the necessary session data
        if (!domain || !req.session[domain] || !req.session[domain].jwtToken) {
            return res.status(400).json({
                success: false,
                error: 'No active reservation session found'
            });
        }

        // Get the JWT token from the session
        const jwtToken = req.session[domain].jwtToken;

        // Use the ID from the session if not provided in request
        const finalReservationId = reservationId || req.session[domain].reservationId;

        if (!finalReservationId) {
            return res.status(400).json({
                success: false,
                error: 'No reservation ID found'
            });
        }

        // Make the confirmation request
        const confirmationData = await foreupService.confirmReservation(
            req.axiosClient,
            domain,
            finalReservationId,
            jwtToken
        );

        res.json({
            success: true,
            confirmation: confirmationData
        });

    } catch (error) {
        if (error instanceof Unauthorized) {
            res.status(401).json({
                success: false,
                error: 'Session expired or invalid'
            });
        } else {
            console.error('Error confirming reservation:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                responseData: error.response ? error.response.data : null
            });
        }
    }
});

/**
 * Endpoint to check session status for a domain
 */
router.get('/session/:id', async (req, res) => {

    if (!req.params.id) {
        return res.status(400).json({
            success: false,
            error: 'Missing course name parameter'
        });
    }
    const id = Number.parseInt(req.params.id);

    if (req.session.foreupSessionData && req.session.foreupSessionData[id]) {
        res.json(req.session.foreupSessionData[id]);
    } else {
        res.status(200).send({});
    }
});


/**
 * Endpoint to get tee times
 */
router.get('/teetimes', async (req, res) => {
    try {
        const {domain, date, time, holes, players, booking_class, schedule_id} = req.query;

        if (!domain || !date) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameters'
            });
        }

        // Check if we have a session for this domain
        if (!req.session[domain] || !req.session[domain].jwtToken) {
            return res.status(401).json({
                success: false,
                error: 'No active session found for this domain'
            });
        }

        // Get the JWT token from the session
        const jwtToken = req.session[domain].jwtToken;

        // Build params object
        const params = {
            date: date,
            time: time || 'all',
            holes: holes || 'all',
            players: players || '0',
            booking_class: booking_class,
            schedule_id: schedule_id,
            schedule_ids: schedule_id ? [schedule_id] : undefined,
            specials_only: '0'
        };

        // Get tee times
        const teeTimes = await foreupService.getTeeTimes(
            req.axiosClient,
            domain,
            params,
            jwtToken
        );

        res.json({
            success: true,
            teeTimes: teeTimes
        });

    } catch (error) {
        if (error instanceof Unauthorized) {
            res.status(401).json({
                success: false,
                error: 'Session expired or invalid'
            });
        } else {
            console.error('Error fetching tee times:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                responseData: error.response ? error.response.data : null
            });
        }
    }
});

module.exports = router;