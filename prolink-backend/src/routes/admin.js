const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const requireAdmin = require('../middleware/requireAdmin');
const { apiLimiter } = require('../middleware/rateLimiter');

// All admin routes require authentication and admin role
router.use(authMiddleware);
router.use(apiLimiter);
router.use(requireAdmin);

// Dashboard Stats
router.get('/stats', adminController.getAdminStats);

// Verifications
router.get('/verifications', adminController.getPendingVerifications);
router.post('/verifications/review', adminController.reviewVerification);

// Users
router.get('/users', adminController.getUsers);
router.patch('/users/:id/status', adminController.updateUserStatus);

// Jobs
router.get('/jobs', adminController.getJobs);
router.delete('/jobs/:id', adminController.deleteJob);

// Disputes — reuse disputes controller, admin can list/resolve all
const disputesController = require('../controllers/disputesController');
const prisma = require('../config/prisma');

router.get('/disputes', disputesController.getDisputes);
router.patch('/disputes/:id/resolve', disputesController.resolveDispute);

router.get('/revenue', async (req, res) => {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [thisMonth, allTime, openDisputes, pendingVerif] = await Promise.all([
      prisma.platformRevenue.aggregate({
        _sum: { fee_amount: true },
        where: { collected_at: { gte: startOfMonth } }
      }),
      prisma.platformRevenue.aggregate({
        _sum: { fee_amount: true }
      }),
      prisma.dispute.count({ where: { status: 'open' } }),
      prisma.profile.count({
        where: {
          OR: [{ nin_status: 'pending' }, { cac_status: 'pending' }]
        }
      }),
    ]);

    res.json({
      revenue_this_month: parseFloat(thisMonth._sum.fee_amount || 0),
      revenue_all_time: parseFloat(allTime._sum.fee_amount || 0),
      open_disputes: openDisputes,
      pending_verifications: pendingVerif,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
});

module.exports = router;
