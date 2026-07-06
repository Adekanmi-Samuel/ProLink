const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/authMiddleware');
const requireProvider = require('../middleware/requireProvider');
const portfolioController = require('../controllers/portfolioController');
const { apiLimiter } = require('../middleware/rateLimiter');

router.use(authMiddleware);
router.use(apiLimiter);

router.post('/', requireProvider, portfolioController.addPortfolioItem);
router.get('/me', requireProvider, portfolioController.getMyPortfolio);
router.delete('/:id', requireProvider, portfolioController.deletePortfolioItem);

module.exports = router;
