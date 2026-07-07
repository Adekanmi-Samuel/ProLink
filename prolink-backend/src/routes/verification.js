const express = require('express');
const router = express.Router();
const verificationController = require('../controllers/verificationController');
const authMiddleware = require('../middleware/authMiddleware');
const { apiLimiter } = require('../middleware/rateLimiter');

router.use(authMiddleware);
router.use(apiLimiter);

router.post('/verify-otp', verificationController.verifyOTP);
router.post('/verify-nin', verificationController.verifyNIN);
router.post('/verify-cac', verificationController.verifyCAC);

module.exports = router;
