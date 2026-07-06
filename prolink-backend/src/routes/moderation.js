const express = require('express');
const moderationController = require('../controllers/moderationController');
const authMiddleware = require('../../middleware/authMiddleware');
const { apiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/blocks', authMiddleware, apiLimiter, moderationController.blockUser);
router.delete('/blocks/:blockedId', authMiddleware, apiLimiter, moderationController.unblockUser);
router.post('/reports', authMiddleware, apiLimiter, moderationController.reportUser);

module.exports = router;
