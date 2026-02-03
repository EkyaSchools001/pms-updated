const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authenticate } = require('../middlewares/authMiddleware');
const { validateChatAccess } = require('../middlewares/rbacMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// All routes require authentication
router.use(authenticate);

router.post('/upload', validateChatAccess, upload.single('file'), chatController.uploadFile);
router.post('/private', chatController.createPrivateChat);
router.post('/message', validateChatAccess, chatController.sendMessage);
router.get('/:chatId/messages', validateChatAccess, chatController.getChatHistory);
router.get('/', chatController.getUserChats);

module.exports = router;
