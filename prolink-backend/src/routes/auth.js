const express = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../../middleware/authMiddleware');
const { loginLimiter, registerLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/register', registerLimiter, authController.register);
router.post('/login', loginLimiter, authController.login);
router.post('/logout', authController.logout);
router.get('/verify', authController.verify);
router.post('/resend-verification', authMiddleware, authController.resendVerification);
router.post('/forgot-password', loginLimiter, authController.forgotPassword);
router.post('/reset-password', loginLimiter, authController.resetPassword);

module.exports = router;