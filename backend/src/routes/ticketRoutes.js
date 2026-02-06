const express = require('express');
const {
    createTicket,
    getTickets,
    updateTicket,
    addTicketComment,
    getTicketStatus,
    getRecentTickets,
    getTicketLogs,
    deleteTicket
} = require('../controllers/ticketController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');


const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.post('/', upload.array('attachments', 5), createTicket);

router.get('/', getTickets);
router.get('/recent', getRecentTickets);
router.get('/:id/status', getTicketStatus);
router.get('/:id/logs', getTicketLogs);
router.put('/:id', updateTicket);
router.delete('/:id', authorize(['ADMIN']), deleteTicket);
router.post('/:id/comments', addTicketComment);



module.exports = router;
