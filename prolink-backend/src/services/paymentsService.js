const prisma = require('../config/prisma');
const crypto = require('crypto');
const emailService = require('./emailService');
const invoiceService = require('./invoiceService');

// PAYSTACK INTEGRATION (WITH MOCK FALLBACK)

const initializePaystackCheckout = async (milestoneId, amount, email) => {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  
  // If we don't have a real key, fallback to a mock checkout flow
  if (!secretKey || secretKey === 'mock') {
    const mockRef = `mock_trx_${Date.now()}`;
    const frontendUrl = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
    
    await prisma.milestone.update({
      where: { id: milestoneId },
      data: { payment_reference: mockRef }
    });

    return {
      authorization_url: `${frontendUrl}/mock-paystack?reference=${mockRef}&amount=${amount}&email=${email}`,
      reference: mockRef
    };
  }

  // REAL PAYSTACK LOGIC
  const response = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email,
      amount: amount * 100, // Paystack expects amount in kobo
      metadata: {
        milestoneId
      }
    })
  });

  const data = await response.json();
  if (!data.status) {
    throw new Error(data.message || 'Paystack initialization failed');
  }

  await prisma.milestone.update({
    where: { id: milestoneId },
    data: { payment_reference: data.data.reference }
  });

  return data.data;
};

const handleWebhook = async (eventData) => {
  // When a charge is successful
  if (eventData.event === 'charge.success') {
    const reference = eventData.data.reference;
    
    // Find the milestone by reference
    const milestone = await prisma.milestone.findFirst({
      where: { payment_reference: reference }
    });

    if (milestone && milestone.status === 'pending') {
      await prisma.milestone.update({
        where: { id: milestone.id },
        data: { status: 'funded' }
      });
    }
  }
};

const confirmMockPayment = async (reference) => {
  const milestone = await prisma.milestone.findFirst({
    where: { payment_reference: reference }
  });

  if (milestone && milestone.status === 'pending') {
    await prisma.milestone.update({
      where: { id: milestone.id },
      data: { status: 'funded' }
    });
  }
};

const mockFundMilestone = async (milestoneId) => {
  const milestone = await prisma.milestone.findUnique({
    where: { id: milestoneId }
  });

  if (milestone && milestone.status === 'pending') {
    await prisma.milestone.update({
      where: { id: milestone.id },
      data: { status: 'funded', payment_reference: `mock_ref_${Date.now()}` }
    });
  }
};

const releaseFunds = async (milestoneId) => {
  const milestone = await prisma.milestone.findUnique({
    where: { id: milestoneId },
    include: { job: { include: { assignment: true } } }
  });

  if (!milestone) {
    throw new Error('Milestone not found');
  }

  if (milestone.status !== 'funded') {
    throw new Error('Milestone must be funded before release');
  }

  const FEE_PERCENT = parseFloat(process.env.PLATFORM_FEE_PERCENT || '10') / 100;
  const gross = parseFloat(milestone.amount);
  const feeAmount = Math.round(gross * FEE_PERCENT * 100) / 100;
  const netPayout = Math.round((gross - feeAmount) * 100) / 100;

  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey || secretKey === 'mock') {
    console.log(`[MOCK] Platform fee collected: ₦${feeAmount.toLocaleString()} from milestone ${milestoneId}`);
    console.log(`[MOCK] Net payout to provider: ₦${netPayout.toLocaleString()}`);
    // Log the platform revenue even in mock mode
    try {
      await prisma.platformRevenue.create({
        data: {
          milestone_id: milestoneId,
          gross_amount: gross,
          fee_percent: FEE_PERCENT * 100,
          fee_amount: feeAmount,
        }
      });
    } catch (logErr) {
      console.warn('[MOCK] Failed to log platform revenue (table may not exist yet):', logErr.message);
    }
    return await prisma.milestone.update({
      where: { id: milestoneId },
      data: { status: 'paid' }
    });
  }

  // Get the provider's BankAccount with Paystack recipient code
  const providerBankAccount = await prisma.bankAccount.findFirst({
    where: {
      profile: {
        user_id: milestone.job.assignment?.provider_id
      }
    },
    select: { paystack_recipient_code: true }
  });

  if (!providerBankAccount?.paystack_recipient_code) {
    throw new Error('Provider has no Paystack recipient code configured. They must set up their bank account first.');
  }

  // Initiate Paystack Transfer
  const response = await fetch('https://api.paystack.co/transfer', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      source: 'balance',
      amount: Math.round(netPayout * 100), // kobo
      recipient: providerBankAccount.paystack_recipient_code,
      reason: `Payment for milestone #${milestoneId}`
    })
  });

  const data = await response.json();
  if (!data.status) {
    throw new Error(data.message || 'Paystack transfer failed');
  }

  // Log the platform fee
  await prisma.platformRevenue.create({
    data: {
      milestone_id: milestoneId,
      gross_amount: gross,
      fee_percent: FEE_PERCENT * 100,
      fee_amount: feeAmount,
    }
  });

  // Mark milestone as paid
  return await prisma.milestone.update({
    where: { id: milestoneId },
    data: { status: 'paid' }
  });
};

// Transfer a specific amount to the provider for the given milestone
const transferToProvider = async (milestoneId, amount) => {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey || secretKey === 'mock') {
    // Mock: just log
    console.log(`[MOCK] Transfer ₦${amount} to provider for milestone ${milestoneId}`);
    return;
  }

  const milestone = await prisma.milestone.findUnique({
    where: { id: milestoneId },
    include: { job: { include: { assignment: true } } }
  });

  if (!milestone) throw new Error('Milestone not found');

  const providerBankAccount = await prisma.bankAccount.findFirst({
    where: { profile: { user_id: milestone.job.assignment?.provider_id } },
    select: { paystack_recipient_code: true }
  });

  if (!providerBankAccount?.paystack_recipient_code) {
    throw new Error('Provider has no Paystack recipient code configured.');
  }

  const response = await fetch('https://api.paystack.co/transfer', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      source: 'balance',
      amount: Math.round(amount * 100), // Convert to kobo
      recipient: providerBankAccount.paystack_recipient_code,
      reason: `Payment for milestone #${milestoneId}`
    })
  });

  const data = await response.json();
  if (!data.status) {
    throw new Error(data.message || 'Paystack transfer failed');
  }
};

// Refund a specific amount back to the client
const refundPortionToClient = async (milestoneId, amount) => {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey || secretKey === 'mock') {
    // Mock: just log
    console.log(`[MOCK] Refund ₦${amount} to client for milestone ${milestoneId}`);
    return;
  }

  // In production, call Paystack Refund API with partial amount
  // This requires the original transaction reference
  const milestone = await prisma.milestone.findUnique({
    where: { id: milestoneId },
    select: { payment_reference: true }
  });

  if (!milestone?.payment_reference) {
    throw new Error('No payment reference found for refund');
  }

  // Paystack partial refund requires using the transaction reference
  const response = await fetch(`https://api.paystack.co/refund`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      transaction: milestone.payment_reference,
      amount: Math.round(amount * 100) // Partial refund amount in kobo
    })
  });

  const data = await response.json();
  if (!data.status) {
    throw new Error(data.message || 'Paystack refund failed');
  }
};

const resolveSplitPayment = async (milestoneId, providerPercentage) => {
  const milestone = await prisma.milestone.findUnique({ where: { id: milestoneId } });
  if (!milestone) throw new Error('Milestone not found');

  const total = parseFloat(milestone.amount);
  const providerAmount = Math.round(total * (providerPercentage / 100) * 100) / 100;
  const clientRefundAmount = Math.round((total - providerAmount) * 100) / 100;

  await transferToProvider(milestoneId, providerAmount);
  await refundPortionToClient(milestoneId, clientRefundAmount);

  await prisma.milestone.update({ where: { id: milestoneId }, data: { status: 'split' } });
  return { providerAmount, clientRefundAmount };
};

const refundClient = async (milestoneId) => {
  const milestone = await prisma.milestone.findUnique({
    where: { id: milestoneId },
    select: { amount: true }
  });
  if (!milestone) throw new Error('Milestone not found');

  await refundPortionToClient(milestoneId, parseFloat(milestone.amount));

  return await prisma.milestone.update({
    where: { id: milestoneId },
    data: { status: 'refunded' }
  });
};

module.exports = {
  initializePaystackCheckout,
  handleWebhook,
  confirmMockPayment,
  mockFundMilestone,
  releaseFunds,
  refundClient,
  resolveSplitPayment,
  transferToProvider,
  refundPortionToClient
};
