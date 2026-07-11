const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/authMiddleware');
const { generateProposal, optimizeProfile, matchJobs, suggestPricing } = require('../controllers/aiController');

// All AI routes require auth
router.use(requireAuth);

router.post('/proposals/generate', generateProposal);
router.post('/profile/optimize', optimizeProfile);
router.get('/jobs/match', matchJobs);
router.post('/services/pricing', suggestPricing);

module.exports = router;
