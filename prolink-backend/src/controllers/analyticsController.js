const pool = require('../../db');

// Get personal analytics for the logged-in user
exports.getUserAnalytics = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userType = req.user.user_type; // 'client' or 'provider'

    let totalSpentOrEarned = 0;
    let completedJobs = 0;
    let activeJobs = 0;
    
    if (userType === 'client') {
      // Client analytics
      const amountRes = await pool.query(
        `SELECT SUM(amount) as total_spent FROM milestones WHERE job_id IN (SELECT id FROM jobs WHERE client_id = $1) AND status = 'released'`,
        [userId]
      );
      totalSpentOrEarned = amountRes.rows[0].total_spent || 0;

      const jobsRes = await pool.query(
        `SELECT 
          COUNT(*) FILTER (WHERE status = 'completed') as completed,
          COUNT(*) FILTER (WHERE status = 'in_progress') as active
         FROM jobs WHERE client_id = $1`,
        [userId]
      );
      completedJobs = jobsRes.rows[0].completed || 0;
      activeJobs = jobsRes.rows[0].active || 0;
    } else {
      // Provider analytics
      const amountRes = await pool.query(
        `SELECT SUM(amount) as total_earned FROM milestones WHERE provider_id = $1 AND status = 'released'`,
        [userId]
      );
      totalSpentOrEarned = amountRes.rows[0].total_earned || 0;

      const jobsRes = await pool.query(
        `SELECT 
          COUNT(*) FILTER (WHERE status = 'completed') as completed,
          COUNT(*) FILTER (WHERE status = 'in_progress') as active
         FROM jobs WHERE provider_id = $1`,
        [userId]
      );
      completedJobs = jobsRes.rows[0].completed || 0;
      activeJobs = jobsRes.rows[0].active || 0;
    }

    res.json({
      success: true,
      data: {
        total_amount: Number(totalSpentOrEarned),
        completed_jobs: Number(completedJobs),
        active_jobs: Number(activeJobs)
      }
    });

  } catch (err) {
    next(err);
  }
};
