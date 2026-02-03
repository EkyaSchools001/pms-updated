const express = require('express');
const { register, login } = require('../controllers/authController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/register', authenticate, authorize(['ADMIN']), register);
router.post('/login', login);

module.exports = router;
