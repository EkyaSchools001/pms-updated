const express = require('express');
const { register, login, getMe } = require('../controllers/authController');
const { googleAuth } = require('../controllers/googleAuthController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/register', authenticate, authorize(['ADMIN']), register);
router.post('/login', login);
router.post('/google', googleAuth);
router.get('/me', authenticate, getMe);
router.get('/status', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

module.exports = router;
