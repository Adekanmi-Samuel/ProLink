const prisma = require('../config/prisma');

const saveJob = async (req, res, next) => {
  try {
    const { jobId } = req.body;
    const userId = req.user.id;

    // Check if job exists
    const job = await prisma.job.findUnique({ where: { id: parseInt(jobId) } });
    if (!job) return res.status(404).json({ error: 'Job not found' });

    // Try to create saved job
    try {
      const savedJob = await prisma.savedJob.create({
        data: {
          user_id: userId,
          job_id: parseInt(jobId),
        },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              budget: true,
              posted_at: true,
              status: true,
              category: { select: { name: true, icon: true } },
            },
          },
        },
      });
      res.status(201).json({ error: 'Job saved', savedJob });
    } catch (error) {
      if (error.code === 'P2002') {
        // Already saved
        return res.status(400).json({ error: 'Job already saved' });
      }
      throw error;
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to save job' });
  }
};

const unsaveJob = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.id;

    const savedJob = await prisma.savedJob.findUnique({
      where: { user_id_job_id: { user_id: userId, job_id: parseInt(jobId) } },
    });

    if (!savedJob) {
      return res.status(404).json({ error: 'Saved job not found' });
    }

    await prisma.savedJob.delete({
      where: { user_id_job_id: { user_id: userId, job_id: parseInt(jobId) } },
    });

    res.json({ error: 'Job unsaved' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to unsave job' });
  }
};

const getSavedJobs = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [savedJobs, total] = await Promise.all([
      prisma.savedJob.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
        skip,
        take: limitNum,
        include: {
          job: {
            select: {
              id: true,
              title: true,
              description: true,
              budget: true,
              job_type: true,
              status: true,
              posted_at: true,
              state: true,
              city: true,
              category: { select: { name: true, icon: true } },
              client: { select: { profile: { select: { full_name: true } } } },
              _count: { select: { bids: true } },
            },
          },
        },
      }),
      prisma.savedJob.count({ where: { user_id: userId } }),
    ]);

    res.json({
      savedJobs: savedJobs.map(sj => ({
        ...sj.job,
        savedAt: sj.created_at,
        bid_count: sj.job._count.bids,
        _count: undefined,
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        hasMore: pageNum * limitNum < total,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch saved jobs' });
  }
};

const checkSavedStatus = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.id;

    const savedJob = await prisma.savedJob.findUnique({
      where: { user_id_job_id: { user_id: userId, job_id: parseInt(jobId) } },
    });

    res.json({ isSaved: !!savedJob });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check saved status' });
  }
};

module.exports = {
  saveJob,
  unsaveJob,
  getSavedJobs,
  checkSavedStatus,
};
