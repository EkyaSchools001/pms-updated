const express = require('express');
const { createTimeLog, getTimeLogs, getTimeStats } = require('../controllers/timeLogController');
const { authenticate } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authenticate);

router.post('/', createTimeLog);
router.get('/', getTimeLogs);
router.get('/stats', getTimeStats);

module.exports = router;
