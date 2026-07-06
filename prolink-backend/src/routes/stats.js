const express = require('express');
const prisma = require('../config/prisma');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [verifiedCount, paidResult, ratingResult] = await Promise.all([
      prisma.profile.count({
        where: { OR: [{ nin_status: 'verified' }, { cac_status: 'verified' }] }
      }),
      prisma.platformRevenue.aggregate({ _sum: { gross_amount: true } }),
      prisma.profile.aggregate({
        _avg: { rating_avg: true },
        where: { user: { user_type: 'provider' }, review_count: { gt: 0 } }
      })
    ]);

    res.json({
      verified_freelancers: verifiedCount,
      total_paid_ngn: parseFloat(paidResult._sum.gross_amount || 0),
      avg_rating: parseFloat(ratingResult._avg.rating_avg || 0).toFixed(1)
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

module.exports = router;
