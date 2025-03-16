const express = require('express');
const teesnapService = require('../../service/courses/teesnap/reservation/reservation');

const router = express.Router();

/**
 * Single endpoint for the whole reservation process
 */
router.post('/reserve', async (req, res) => {
    try {
        const { domain, email, password, reservationData } = req.body;

        // Validate required parameters
        if (!domain || !email || !password || !reservationData) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameters'
            });
        }

        // Run the complete flow
        const result = await teesnapService.completeTeesnapFlow(
            req.cookieClient,
            domain,
            email,
            password,
            reservationData
        );

        // Save the session
        req.saveCookieJar();

        // Store the reservation ID and token in the session for later confirmation
        req.session.reservationId = result.quoteData.id;
        req.session.lastToken = result.token;
        req.session.domain = domain;

        res.json({
            success: true,
            loginData: result.loginData,
            reservationQuote: result.quoteData
        });
    } catch (error) {
        console.error('Error processing reservation:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            responseData: error.response ? error.response.data : null
        });
    }
});

/**
 * Endpoint to confirm the reservation
 */
router.post('/confirm', async (req, res) => {
    try {
        const { reservationId } = req.body;
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
            req.cookieClient,
            domain,
            finalReservationId,
            token
        );

        // Save the updated cookie jar
        req.saveCookieJar();

        res.json({
            success: true,
            confirmation: confirmationData
        });
    } catch (error) {
        console.error('Error confirming reservation:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            responseData: error.response ? error.response.data : null
        });
    }
});

module.exports = router;