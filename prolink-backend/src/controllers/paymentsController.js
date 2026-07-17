const paymentsService = require('../services/paymentsService');
const prisma = require('../config/prisma');
const crypto = require('crypto');

const initializePayment = async (req, res, next) => {
  try {
    const { milestoneId } = req.body;
    
    // Verify client
    const milestone = await prisma.milestone.findUnique({ 
      where: { id: parseInt(milestoneId) },
      include: { job: { include: { client: true } } }
    });

    if (!milestone) return res.status(404).json({ error: 'Milestone not found' });
    if (milestone.job.client_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the client can fund this milestone' });
    }
    if (milestone.status !== 'pending') {
      return res.status(400).json({ error: 'Milestone is not pending' });
    }

    const email = milestone.job.client.email;
    const result = await paymentsService.initializePaystackCheckout(milestone.id, milestone.amount, email, milestone.job_id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to initialize payment' });
  }
};

const paystackWebhook = async (req, res, next) => {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY?.trim();
    
    // Validate Paystack signature
    if (secret && secret !== 'mock') {
      const payload = req.rawBody || JSON.stringify(req.body);
      const hash = crypto.createHmac('sha512', secret).update(payload).digest('hex');
      if (hash !== req.headers['x-paystack-signature']) {
        console.error('Webhook signature mismatch', { expected: hash, received: req.headers['x-paystack-signature'] });
        return res.status(400).send('Invalid signature');
      }
    }

    const event = req.body;
    await paymentsService.handleWebhook(event);

    res.sendStatus(200);
  } catch (error) {
    // Log the error server-side but always return 200 to Paystack.
    // Returning 500 causes Paystack to retry the webhook repeatedly,
    // leading to duplicate processing and a retry storm.
    console.error('Webhook Error:', error);
    res.sendStatus(200);
  }
};

const mockConfirmPayment = async (req, res, next) => {
  try {
    const { reference } = req.body;
    await paymentsService.confirmMockPayment(reference);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to confirm mock payment' });
  }
};

const mockFundMilestone = async (req, res, next) => {
  try {
    const { milestoneId } = req.body;
    await paymentsService.mockFundMilestone(parseInt(milestoneId));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fund milestone' });
  }
};

const verifyPayment = async (req, res, next) => {
  try {
    const { reference } = req.body;
    if (!reference) return res.status(400).json({ error: 'Reference is required' });
    
    const success = await paymentsService.verifyPaystackPayment(reference);
    if (success) {
      res.json({ success: true, msg: 'Payment verified and escrowed successfully' });
    } else {
      res.status(400).json({ success: false, error: 'Payment verification failed' });
    }
  } catch (error) {
    console.error('Verify Payment Error:', error);
    res.status(500).json({ error: 'Server error during verification' });
  }
};

const resolveBankAccount = async (req, res, next) => {
  try {
    const { account_number, bank_code } = req.query;
    if (!account_number || !bank_code) {
      return res.status(400).json({ error: 'account_number and bank_code are required' });
    }
    const result = await paymentsService.resolveBankAccount(account_number, bank_code);
    res.json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message || 'Failed to resolve bank account' });
  }
};

module.exports = {
  initializePayment,
  paystackWebhook,
  verifyPayment,
  mockConfirmPayment,
  mockFundMilestone,
  resolveBankAccount
};
