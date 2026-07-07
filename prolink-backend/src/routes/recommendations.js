const express = require('express');
const router = express.Router();
const recommendationsController = require('../controllers/recommendationsController');
const authMiddleware = require('../middleware/authMiddleware');
const { searchLimiter } = require('../middleware/rateLimiter');

router.get('/jobs', authMiddleware, searchLimiter, recommendationsController.recommendJobsForProvider);
router.get('/providers/:jobId', searchLimiter, recommendationsController.recommendProvidersForJob);

module.exports = router;
