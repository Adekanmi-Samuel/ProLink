const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/authMiddleware');
const reviewsController = require('../controllers/reviewsController');
const { apiLimiter, searchLimiter } = require('../middleware/rateLimiter');

router.get('/user/:userId', searchLimiter, reviewsController.getReviewsForUser);

router.use(authMiddleware);
router.post('/', apiLimiter, reviewsController.submitReview);

module.exports = router;
