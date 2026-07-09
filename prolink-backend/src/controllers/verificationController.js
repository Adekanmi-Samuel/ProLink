const prisma = require('../config/prisma');

const verifyOTP = async (req, res, next) => {
  try {
    const { otp_code } = req.body;
    const userId = req.user.id;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.email_verified) {
      return res.status(400).json({ error: 'Email is already verified' });
    }

    if (user.otp_code !== otp_code) {
      return res.status(400).json({ error: 'Invalid OTP code' });
    }

    if (new Date() > new Date(user.otp_expires_at)) {
      return res.status(400).json({ error: 'OTP code has expired' });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        email_verified: true,
        otp_code: null,
        otp_expires_at: null
      }
    });

    res.json({ message: 'Email verified successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

const verifyNIN = async (req, res, next) => {
  try {
    const { nin_number } = req.body;
    const userId = req.user.id;

    if (!nin_number || nin_number.length < 11) {
      return res.status(400).json({ error: 'Valid NIN is required (11 digits)' });
    }

    await prisma.profile.upsert({
      where: { user_id: userId },
      update: {
        nin_number,
        nin_status: 'pending' // Admin review needed
      },
      create: {
        user_id: userId,
        full_name: 'Unknown',
        nin_number,
        nin_status: 'pending'
      }
    });

    res.json({ message: 'NIN submitted for review successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

const verifyCAC = async (req, res, next) => {
  try {
    const { cac_number } = req.body;
    const userId = req.user.id;

    if (!cac_number) {
      return res.status(400).json({ error: 'CAC Number is required' });
    }

    await prisma.profile.upsert({
      where: { user_id: userId },
      update: {
        cac_number,
        cac_status: 'pending'
      },
      create: {
        user_id: userId,
        full_name: 'Unknown',
        cac_number,
        cac_status: 'pending'
      }
    });

    res.json({ message: 'CAC submitted for review successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  verifyOTP,
  verifyNIN,
  verifyCAC
};
