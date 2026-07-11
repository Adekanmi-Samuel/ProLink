const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/authMiddleware');
const { generateProposal } = require('../controllers/aiController');

// All AI routes require auth
router.use(requireAuth);

router.post('/proposals/generate', generateProposal);

module.exports = router;
