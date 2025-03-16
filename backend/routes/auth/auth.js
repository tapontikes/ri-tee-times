// routes/user-routes.js
const express = require('express');
const router = express.Router();


// API endpoint to get user-specific data
router.get('/session', (req, res) => {
    res.json({
        userId: req.session.userId,
        preferences: req.session.preferences || {},
        createdAt: req.session.createdAt
    });
});

// API endpoint to update user preferences
router.post('/session', (req, res) => {
    req.session.preferences = {
        ...req.session.preferences,
        ...req.body
    };
    res.json({
        success: true,
        preferences: req.session.preferences
    });
});


module.exports = router;