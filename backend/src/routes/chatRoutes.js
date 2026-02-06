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
router.put('/message/:messageId', chatController.editMessage);
router.delete('/message/:messageId', chatController.deleteMessage);
router.get('/:chatId/messages', validateChatAccess, chatController.getChatHistory);
router.post('/:chatId/clear', validateChatAccess, chatController.clearChat);
router.delete('/:chatId', validateChatAccess, chatController.deleteChat);
router.get('/', chatController.getUserChats);

module.exports = router;
