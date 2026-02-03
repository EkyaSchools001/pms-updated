const express = require('express');
const router = express.Router();
const { getRooms, createRoom, updateRoom, addAvailability, blockRoom } = require('../controllers/roomController');
const { authenticate } = require('../middlewares/authMiddleware');
const { authorizeRole } = require('../middlewares/rbacMiddleware');

router.use(authenticate);

router.get('/', getRooms);

// Admin only actions
router.post('/', authorizeRole('ADMIN'), createRoom);
router.put('/:id', authorizeRole('ADMIN'), updateRoom);
router.post('/:id/availability', authorizeRole('ADMIN'), addAvailability);
router.post('/:id/block', authorizeRole('ADMIN'), blockRoom);

module.exports = router;
