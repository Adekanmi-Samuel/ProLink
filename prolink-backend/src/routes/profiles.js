const express = require('express');
const profilesController = require('../controllers/profilesController');
const authMiddleware = require('../../middleware/authMiddleware');
const { apiLimiter, searchLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.get('/me', authMiddleware, apiLimiter, profilesController.getMyProfile);
router.put('/me', authMiddleware, apiLimiter, profilesController.updateProfile);
router.put('/me/picture', authMiddleware, apiLimiter, profilesController.updatePicture);

router.get('/me/bank', authMiddleware, apiLimiter, profilesController.getBankAccount);
router.post('/me/bank', authMiddleware, apiLimiter, profilesController.saveBankAccount);
router.get('/me/earnings', authMiddleware, apiLimiter, profilesController.getMyEarnings);
router.get('/me/earnings-chart', authMiddleware, apiLimiter, profilesController.getEarningsChart);

router.get('/:id', searchLimiter, profilesController.getProfileById);
router.get('/:id/reviews', searchLimiter, profilesController.getProfileReviews);

module.exports = router;