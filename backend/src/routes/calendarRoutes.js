const express = require('express');
const router = express.Router();
const { getCalendarEvents, saveCalendarView } = require('../controllers/calendarController');
const { authenticate } = require('../middlewares/authMiddleware');

router.use(authenticate);

router.get('/events', getCalendarEvents);
router.post('/views', saveCalendarView);

module.exports = router;
