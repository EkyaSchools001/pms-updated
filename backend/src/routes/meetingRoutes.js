const express = require('express');
const router = express.Router();
const { getMeetings, scheduleMeeting, rsvpMeeting, cancelMeeting, updateMeeting } = require('../controllers/meetingController');
const { authenticate } = require('../middlewares/authMiddleware');

router.use(authenticate);

router.get('/', getMeetings);
router.post('/', scheduleMeeting);
router.post('/:id/rsvp', rsvpMeeting);
router.put('/:id', updateMeeting);
router.delete('/:id', cancelMeeting);

module.exports = router;
