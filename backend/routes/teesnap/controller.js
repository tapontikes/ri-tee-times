const express = require('express');
const teesnapService = require('../../service/courses/teesnap/reservation/reservation');
const sessionService = require('../../service/courses/teesnap/session/session');
const {Unauthorized} = require("http-errors");

const router = express.Router();

/**
 * Endpoint to login to Teesnap
 */
router.post('/login', async (req, res) => {
    try {
        const {domain, email, password, id} = req.body;

        // Validate required parameters
        if (!domain || !email || !password || !id) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameters for login'
            });
        }

        // Get CSRF token
        const initialToken = await teesnapService.getXSRFToken(req.axiosClient, domain);

        // Login
        const loginData = await teesnapService.login(req.axiosClient, domain, email, password, initialToken);

        // Save the cookie jar to the session
        req.saveCookieJar(req.axiosClient.defaults.jar);

        const session = await sessionService.getSession(req.axiosClient, id);
        res.json(session);

    } catch (error) {
        if (error.response.data.errors === "credentials_incorrect") {
            res.status(401).send();
        } else {
            res.status(500).json({
                success: false,
                error: error.message,
                responseData: error.response ? error.response.data : null
            });
        }
    }
});

/**
 * Endpoint to reserve a tee time
 */
router.post('/reserve', async (req, res) => {
    try {

        const {reservationData} = req.body;

        if (!reservationData) {
            return res.status(400).json({
                success: false,
                error: 'Missing reservation data'
            });
        }


        // Get reservation quote
        const quoteData = await teesnapService.getReservationQuote(
            req.axiosClient,
            reservationData.domain,
            reservationData
        );

        req.saveCookieJar(req.axiosClient.defaults.jar);

        res.json({
            success: true,
            reservationQuote: quoteData
        });
    } catch (error) {
        if (error instanceof Unauthorized) {
            res.status(401).send();
        } else {
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
        const {reservationId} = req.body;
        const domain = req.session.domain;
        const token = req.session.lastToken;

        // Verify we have the necessary session data
        if (!domain || !token) {
            return res.status(400).json({
                success: false,
                error: 'No active reservation session found'
            });
        }

        // Use the ID from the session if not provided in request
        const finalReservationId = reservationId || req.session.reservationId;

        if (!finalReservationId) {
            return res.status(400).json({
                success: false,
                error: 'No reservation ID found'
            });
        }

        // Make the confirmation request
        const confirmationData = await teesnapService.confirmReservation(
            req.axiosClient,
            domain,
            finalReservationId,
            token
        );

        // Save the updated cookie jar
        req.saveCookieJar(req.axiosClient.defaults.jar);

        res.json({
            success: true,
            confirmation: confirmationData
        });

    } catch (error) {
        if (error instanceof Unauthorized) {
            res.status(401).send();
        } else {
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
    const id = req.params.id;

    if (!id) {
        return res.status(400).json({
            success: false,
            error: 'Missing domain parameter'
        });
    }

    const session = await sessionService.getSession(req.axiosClient, id);
    if (session) {
        res.json(session);

    } else {
        res.status(200).json({});
    }
});

module.exports = router;