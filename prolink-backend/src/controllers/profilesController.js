const profilesService = require('../services/profilesService');
const prisma = require('../config/prisma');
const getMyProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const profile = await profilesService.getMyProfile(userId);
    if (!profile) return res.status(404).json({ msg: 'Profile not found' });
    res.set('Cache-Control', 'private, max-age=10, stale-while-revalidate=5');
    res.json(profile);
  } catch (err) {
    next(err);
  }
};

const getProfileById = async (req, res, next) => {
  try {
    const profile = await profilesService.getProfileById(parseInt(req.params.id));
    if (!profile) return res.status(404).json({ msg: 'Profile not found' });
    res.json(profile);
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { fullName, bio, phoneNumber, title, hourlyRate, availability, skillIds, state, city, gender, ratePeriod } = req.validatedBody || req.body;
    await profilesService.updateProfile(userId, {
      full_name: fullName,
      bio,
      phone_number: phoneNumber,
      title,
      hourly_rate: hourlyRate ? parseFloat(hourlyRate) : null,
      availability,
      state,
      city,
      gender,
      rate_period: ratePeriod,
    }, skillIds);
    res.json({ msg: 'Profile updated successfully.' });
  } catch (err) {
    next(err);
  }
};

const updatePicture = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { profile_picture_url } = req.validatedBody || req.body;
    if (!profile_picture_url) return res.status(400).json({ msg: 'URL required' });

    // Get old picture URL for cleanup
    const currentProfile = await profilesService.getMyProfile(userId);
    const oldPictureUrl = currentProfile?.profile_picture_url;

    // Update to new picture
    await profilesService.updateProfile(userId, { profile_picture_url });

    // Clean up old image from Cloudinary (if it's a Cloudinary URL)
    if (oldPictureUrl && oldPictureUrl !== profile_picture_url) {
      try {
        const cloudinary = require('cloudinary').v2;
        const parts = oldPictureUrl.split('/');
        const fileWithExt = parts[parts.length - 1];
        const publicId = fileWithExt.replace(/\.[^.]+$/, '');
        if (publicId) {
          await cloudinary.uploader.destroy('prolink_uploads/' + publicId);
        }
      } catch (cleanupErr) {
        console.warn('Old image cleanup skipped:', cleanupErr.message);
      }
    }

    res.json({ msg: 'Profile picture updated.' });
  } catch (err) {
    next(err);
  }
};

const getProfileReviews = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await profilesService.getProfileReviews(parseInt(req.params.id), { page, limit });
    if (!result) return res.status(404).json({ msg: 'Profile not found' });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const getBankAccount = async (req, res, next) => {
  try {
    const bankAccount = await profilesService.getBankAccount(req.user.id);
    res.json(bankAccount || {});
  } catch (err) {
    next(err);
  }
};

const saveBankAccount = async (req, res, next) => {
  try {
    const { bank_name, bank_code, account_number, account_name } = req.validatedBody || req.body;
    if (!bank_name || !bank_code || !account_number || !account_name) {
      return res.status(400).json({ msg: 'All bank details are required.' });
    }
    const bankAccount = await profilesService.saveBankAccount(req.user.id, { bank_name, bank_code, account_number, account_name });
    res.json({ msg: 'Bank details saved successfully', bankAccount });
  } catch (err) {
    next(err);
  }
};

const getMyEarnings = async (req, res, next) => {
  try {
    const earnings = await profilesService.getMyEarnings(req.user.id);
    res.json(earnings);
  } catch (err) {
    next(err);
  }
};

const getEarningsChart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const milestones = await prisma.milestone.findMany({
      where: {
        status: { in: ['approved', 'paid'] },
        updated_at: { gte: sixMonthsAgo },
        job: { assignment: { provider_id: userId } }
      },
      select: { amount: true, updated_at: true }
    });

    const monthMap = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toLocaleString('default', { month: 'short' });
      monthMap[key] = 0;
    }

    for (const m of milestones) {
      const key = new Date(m.updated_at).toLocaleString('default', { month: 'short' });
      if (monthMap[key] !== undefined) monthMap[key] += parseFloat(m.amount);
    }

    const data = Object.entries(monthMap).map(([name, earnings]) => ({ name, earnings }));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load chart data' });
  }
};

module.exports = {
  getMyProfile,
  getProfileById,
  updateProfile,
  updatePicture,
  getProfileReviews,
  getBankAccount,
  saveBankAccount,
  getMyEarnings,
  getEarningsChart
};