const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authenticate } = require('../middlewares/authMiddleware');


// POST /api/v1/ai/analyze
router.post('/analyze', authenticate, aiController.analyzeProjectData);

module.exports = router;
