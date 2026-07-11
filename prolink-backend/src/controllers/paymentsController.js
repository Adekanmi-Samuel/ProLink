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

    if (!milestone) return res.status(404).json({ msg: 'Milestone not found' });
    if (milestone.job.client_id !== req.user.id) {
      return res.status(403).json({ msg: 'Only the client can fund this milestone' });
    }
    if (milestone.status !== 'pending') {
      return res.status(400).json({ msg: 'Milestone is not pending' });
    }

    const email = milestone.job.client.email;
    const result = await paymentsService.initializePaystackCheckout(milestone.id, milestone.amount, email);
    res.json(result);
  } catch (error) {
    res.status(500).json({ msg: error.message || 'Failed to initialize payment' });
  }
};

const paystackWebhook = async (req, res, next) => {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    
    // Validate Paystack signature
    if (secret && secret !== 'mock') {
      const payload = req.rawBody || JSON.stringify(req.body);
      const hash = crypto.createHmac('sha512', secret).update(payload).digest('hex');
      if (hash !== req.headers['x-paystack-signature']) {
        return res.status(400).send('Invalid signature');
      }
    }

    const event = req.body;
    await paymentsService.handleWebhook(event);

    res.sendStatus(200);
  } catch (error) {
    res.sendStatus(500);
  }
};

const mockConfirmPayment = async (req, res, next) => {
  try {
    const { reference } = req.body;
    await paymentsService.confirmMockPayment(reference);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ msg: 'Failed to confirm mock payment' });
  }
};

const mockFundMilestone = async (req, res, next) => {
  try {
    const { milestoneId } = req.body;
    await paymentsService.mockFundMilestone(parseInt(milestoneId));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ msg: 'Failed to fund milestone' });
  }
};

module.exports = {
  initializePayment,
  paystackWebhook,
  mockConfirmPayment,
  mockFundMilestone
};
