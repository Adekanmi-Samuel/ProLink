const express = require('express');
const profilesController = require('../controllers/profilesController');
const authMiddleware = require('../middleware/authMiddleware');
const { apiLimiter, searchLimiter } = require('../middleware/rateLimiter');
const { validateRequest } = require('../middleware/validationMiddleware');
const { updateProfileSchema, updatePictureSchema, saveBankAccountSchema } = require('../validators/profileValidator');

const router = express.Router();

// Profile endpoints
router.get('/me', authMiddleware, apiLimiter, profilesController.getMyProfile);
router.put('/me', authMiddleware, apiLimiter, validateRequest(updateProfileSchema), profilesController.updateProfile);
router.put('/me/picture', authMiddleware, apiLimiter, validateRequest(updatePictureSchema), profilesController.updatePicture);

router.get('/me/bank', authMiddleware, apiLimiter, profilesController.getBankAccount);
router.post('/me/bank', authMiddleware, apiLimiter, validateRequest(saveBankAccountSchema), profilesController.saveBankAccount);
router.get('/me/earnings', authMiddleware, apiLimiter, profilesController.getMyEarnings);
router.get('/me/earnings-chart', authMiddleware, apiLimiter, profilesController.getEarningsChart);

// Public profile endpoints
router.get('/:id', searchLimiter, profilesController.getProfileById);
router.get('/:id/reviews', searchLimiter, profilesController.getProfileReviews);

module.exports = router;
