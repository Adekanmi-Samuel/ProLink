const prisma = require('../config/prisma');

// Get personal analytics for the logged-in user
exports.getUserAnalytics = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userType = req.user.user_type; // 'client' or 'provider'

    let totalSpentOrEarned = 0;
    let completedJobs = 0;
    let activeJobs = 0;

    if (userType === 'client') {
      // Client analytics: sum of milestones on jobs where user is the client
      const amountRes = await prisma.milestone.aggregate({
        _sum: { amount: true },
        where: {
          status: { in: ['approved', 'paid'] },
          job: { client_id: userId }
        }
      });
      totalSpentOrEarned = parseFloat(amountRes._sum.amount || 0);

      const [completedRes, activeRes] = await Promise.all([
        prisma.job.count({ where: { client_id: userId, status: 'completed' } }),
        prisma.job.count({ where: { client_id: userId, status: 'assigned' } }),
      ]);
      completedJobs = completedRes;
      activeJobs = activeRes;
    } else {
      // Provider analytics: sum of milestones on jobs where user is the assigned provider
      const amountRes = await prisma.milestone.aggregate({
        _sum: { amount: true },
        where: {
          status: { in: ['approved', 'paid'] },
          job: { assignment: { provider_id: userId } }
        }
      });
      totalSpentOrEarned = parseFloat(amountRes._sum.amount || 0);

      const [completedRes, activeRes] = await Promise.all([
        prisma.job.count({
          where: { status: 'completed', assignment: { provider_id: userId } }
        }),
        prisma.job.count({
          where: { status: 'assigned', assignment: { provider_id: userId } }
        }),
      ]);
      completedJobs = completedRes;
      activeJobs = activeRes;
    }

    res.json({
      success: true,
      data: {
        total_amount: totalSpentOrEarned,
        completed_jobs: completedJobs,
        active_jobs: activeJobs
      }
    });

  } catch (err) {
    next(err);
  }
};
