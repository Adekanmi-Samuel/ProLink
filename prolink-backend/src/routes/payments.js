const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const paymentsController = require('../controllers/paymentsController');
const requireClient = require('../middleware/requireClient');
const { apiLimiter, webhookLimiter } = require('../middleware/rateLimiter');

// Webhook must be outside auth middleware so Paystack can hit it
router.post('/webhook', webhookLimiter, paymentsController.paystackWebhook);

// All other routes require authentication
router.use(authMiddleware);
router.use(apiLimiter);

// Mock confirm + direct fund - explicitly gated by env var, never by NODE_ENV alone.
// Set ENABLE_MOCK_PAYMENTS=true only in local development.
if (process.env.ENABLE_MOCK_PAYMENTS === 'true') {
  router.post('/mock-confirm', paymentsController.mockConfirmPayment);
  router.post('/mock-fund', paymentsController.mockFundMilestone);
}

router.post('/initialize', requireClient, paymentsController.initializePayment);
router.post('/verify', paymentsController.verifyPayment);
router.get('/resolve-bank', paymentsController.resolveBankAccount);

module.exports = router;
