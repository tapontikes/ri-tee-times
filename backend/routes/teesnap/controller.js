const express = require('express');
const teesnapService = require('../../service/courses/teesnap/reservation/reservation');

const router = express.Router();

/**
 * Endpoint to login to Teesnap
 */
router.post('/login', async (req, res) => {
    try {
        const {domain, email, password} = req.body;

        // Validate required parameters
        if (!domain || !email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameters for login'
            });
        }

        // Get CSRF token
        const initialToken = await teesnapService.getXSRFToken(req.axiosClient, domain);

        // Login
        const loginData = await teesnapService.login(req.axiosClient, domain, email, password, initialToken);

        req.saveCookieJar(req.axiosClient.defaults.jar);

        res.json({
            success: true,
            loginData: loginData
        });
    } catch (error) {
        console.error('Error during login:', error);
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
        console.error('Error confirming reservation:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            responseData: error.response ? error.response.data : null
        });
    }
});

module.exports = router;