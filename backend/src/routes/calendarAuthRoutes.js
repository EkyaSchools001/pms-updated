const express = require('express');
const router = express.Router();
const { getAuthUrl, getTokens } = require('../services/googleCalendarService');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');

// Middleware to authenticate PMS user
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'No token provided' });

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

router.get('/google', authenticate, (req, res) => {
    const authUrl = getAuthUrl();
    // We pass the userId in the state to retrieve it in the callback
    // However, it's better to store it in a session or just return the URL
    // For simplicity, we just return the URL. The frontend will redirect.
    res.json({ url: authUrl });
});

router.get('/google/callback', async (req, res) => {
    const { code, state } = req.query;

    try {
        const tokens = await getTokens(code);

        // In a real app, you'd handle the state to know which user this is.
        // Or you might have a frontend that sends the code to a POST endpoint.
        // Let's assume the frontend will handle the callback and send the code to our backend POST endpoint.
        res.redirect(`${process.env.FRONTEND_URL}/calendar?code=${code}`);
    } catch (error) {
        res.status(500).json({ message: 'Authentication failed' });
    }
});

router.post('/google/tokens', authenticate, async (req, res) => {
    const { code } = req.body;

    try {
        const tokens = await getTokens(code);

        // Update user with tokens
        const updatedUser = await prisma.user.update({
            where: { id: req.userId },
            data: {
                googleAccessToken: tokens.access_token,
                googleRefreshToken: tokens.refresh_token,
                // googleEmail could be fetched from userinfo if needed
            },
        });

        res.json({ message: 'Successfully connected to Google Calendar', user: updatedUser });
    } catch (error) {
        console.error('Google token exchange error:', error);
        res.status(500).json({ message: 'Failed to exchange tokens' });
    }
});

router.get('/google/status', authenticate, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            select: { googleAccessToken: true, googleRefreshToken: true }
        });

        res.json({ isConnected: !!(user.googleAccessToken && user.googleRefreshToken) });
    } catch (error) {
        res.status(500).json({ message: 'Failed to get connection status' });
    }
});

module.exports = router;
