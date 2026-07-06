const prisma = require('../config/prisma');

// Get all pending verifications (NIN and CAC)
const getPendingVerifications = async (req, res) => {
  try {
    const pendingProfiles = await prisma.profile.findMany({
      where: {
        OR: [
          { nin_status: 'pending' },
          { cac_status: 'pending' }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            user_type: true
          }
        }
      }
    });

    res.json(pendingProfiles);
  } catch (error) {
    console.error('Error fetching pending verifications:', error);
    res.status(500).json({ error: 'Failed to fetch pending verifications' });
  }
};

// Approve or reject a verification
const reviewVerification = async (req, res) => {
  try {
    const { userId, type, action } = req.body; 
    // type: 'nin' | 'cac'
    // action: 'approve' | 'reject'

    if (!userId || !['nin', 'cac'].includes(type) || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Invalid request parameters' });
    }

    const status = action === 'approve' ? 'verified' : 'rejected';
    
    const updateData = {};
    if (type === 'nin') {
      updateData.nin_status = status;
    } else {
      updateData.cac_status = status;
    }

    const updatedProfile = await prisma.profile.update({
      where: { user_id: parseInt(userId) },
      data: updateData,
      include: {
        user: {
          select: { email: true }
        }
      }
    });

    // TODO: Optionally send email notification to updatedProfile.user.email

    res.json({ message: `${type.toUpperCase()} verification ${status}`, profile: updatedProfile });
  } catch (error) {
    console.error('Error reviewing verification:', error);
    res.status(500).json({ error: 'Failed to review verification' });
  }
};

// Get all users or search by email/name/type
const getUsers = async (req, res) => {
  try {
    const { q, user_type, status, page, limit } = req.query;
    const take = Math.min(50, Math.max(1, parseInt(limit) || 20));
    const skip = (Math.max(1, parseInt(page) || 1) - 1) * take;

    const where = {};
    if (q) {
      where.OR = [
        { email: { contains: q, mode: 'insensitive' } },
        { profile: { full_name: { contains: q, mode: 'insensitive' } } }
      ];
    }
    if (user_type) where.user_type = user_type;
    if (status) where.status = status;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { created_at: 'desc' },
        select: {
          id: true, email: true, user_type: true, status: true,
          email_verified: true, created_at: true,
          profile: { select: { full_name: true, profile_picture_url: true, rating_avg: true } },
          _count: { select: { jobs: true, bids: true } }
        }
      }),
      prisma.user.count({ where })
    ]);

    res.json({ users, pagination: { page: Math.max(1, parseInt(page) || 1), limit: take, total } });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// Ban or suspend a user
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'suspended', 'banned'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be active, suspended, or banned' });
    }

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { status },
      select: { id: true, email: true, status: true, user_type: true }
    });

    res.json({ message: `User ${status} successfully`, user });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
};

// Get all jobs (admin view)
const getJobs = async (req, res) => {
  try {
    const { q, status, page, limit } = req.query;
    const take = Math.min(50, Math.max(1, parseInt(limit) || 20));
    const skip = (Math.max(1, parseInt(page) || 1) - 1) * take;

    const where = {};
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } }
      ];
    }
    if (status) where.status = status;

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        skip,
        take,
        orderBy: { posted_at: 'desc' },
        select: {
          id: true, title: true, budget: true, job_type: true, status: true,
          posted_at: true,
          client: { select: { profile: { select: { full_name: true } } } },
          category: { select: { name: true } },
          _count: { select: { bids: true } }
        }
      }),
      prisma.job.count({ where })
    ]);

    res.json({ jobs, pagination: { page: Math.max(1, parseInt(page) || 1), limit: take, total } });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
};

// Admin: delete a job (soft)
const deleteJob = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.job.update({
      where: { id: parseInt(id) },
      data: { status: 'cancelled' }
    });
    res.json({ message: 'Job cancelled successfully' });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ error: 'Failed to delete job' });
  }
};

module.exports = {
  getPendingVerifications,
  reviewVerification,
  getUsers,
  updateUserStatus,
  getJobs,
  deleteJob
};
