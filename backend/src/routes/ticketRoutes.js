const express = require('express');
const {
    createTicket,
    getTickets,
    updateTicket,
    addTicketComment,
    getTicketStatus,
    getRecentTickets,
    getTicketLogs
} = require('../controllers/ticketController');
const { authenticate } = require('../middlewares/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.post('/', createTicket);
router.get('/', getTickets);
router.get('/recent', getRecentTickets);
router.get('/:id/status', getTicketStatus);
router.get('/:id/logs', getTicketLogs);
router.put('/:id', updateTicket);
router.post('/:id/comments', addTicketComment);



module.exports = router;
