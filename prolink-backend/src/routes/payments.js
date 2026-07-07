const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/authMiddleware');
const paymentsController = require('../controllers/paymentsController');
const requireClient = require('../middleware/requireClient');
const { apiLimiter, webhookLimiter } = require('../middleware/rateLimiter');

// Webhook must be outside auth middleware so Paystack can hit it
router.post('/webhook', webhookLimiter, express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}), paymentsController.paystackWebhook);

// All other routes require authentication
router.use(authMiddleware);
router.use(apiLimiter);

// Mock confirm + direct fund — dev-only. Delete this when Paystack is fully live.
if (process.env.NODE_ENV !== 'production') {
  router.post('/mock-confirm', paymentsController.mockConfirmPayment);
  router.post('/mock-fund', paymentsController.mockFundMilestone);
}

router.post('/initialize', requireClient, paymentsController.initializePayment);

module.exports = router;
