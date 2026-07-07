const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/me', authMiddleware, analyticsController.getUserAnalytics);

module.exports = router;
