const express = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../../middleware/authMiddleware');
const { loginLimiter, registerLimiter } = require('../middleware/rateLimiter');
const { validateRegister, validateLogin, validateForgotPassword, validateResetPassword } = require('../middleware/validateAuth');

const router = express.Router();

router.post('/register', registerLimiter, validateRegister, authController.register);
router.post('/login', loginLimiter, validateLogin, authController.login);
router.post('/logout', authMiddleware, authController.logout);
router.get('/verify', authController.verify);
router.post('/resend-verification', authMiddleware, authController.resendVerification);
router.post('/forgot-password', loginLimiter, validateForgotPassword, authController.forgotPassword);
router.post('/reset-password', loginLimiter, validateResetPassword, authController.resetPassword);

module.exports = router;