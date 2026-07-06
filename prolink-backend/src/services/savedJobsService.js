const prisma = require('../config/prisma');

const saveJob = async (userId, jobId) => {
  const job = await prisma.job.findUnique({ where: { id: parseInt(jobId) } });
  if (!job) throw new Error('Job not found');

  try {
    const savedJob = await prisma.savedJob.create({
      data: {
        user_id: userId,
        job_id: parseInt(jobId),
      },
    });
    return savedJob;
  } catch (error) {
    if (error.code === 'P2002') {
      throw new Error('Job already saved');
    }
    throw error;
  }
};

const unsaveJob = async (userId, jobId) => {
  const savedJob = await prisma.savedJob.findUnique({
    where: { user_id_job_id: { user_id: userId, job_id: parseInt(jobId) } },
  });

  if (!savedJob) {
    throw new Error('Saved job not found');
  }

  await prisma.savedJob.delete({
    where: { user_id_job_id: { user_id: userId, job_id: parseInt(jobId) } },
  });

  return { success: true };
};

const getSavedJobs = async (userId, filters = {}) => {
  const page = Math.max(1, parseInt(filters.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(filters.limit) || 20));
  const skip = (page - 1) * limit;

  const [savedJobs, total] = await Promise.all([
    prisma.savedJob.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
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

  return {
    savedJobs: savedJobs.map(sj => ({
      ...sj.job,
      savedAt: sj.created_at,
      bid_count: sj.job._count.bids,
      _count: undefined,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  };
};

const checkSavedStatus = async (userId, jobId) => {
  const savedJob = await prisma.savedJob.findUnique({
    where: { user_id_job_id: { user_id: userId, job_id: parseInt(jobId) } },
  });

  return !!savedJob;
};

module.exports = {
  saveJob,
  unsaveJob,
  getSavedJobs,
  checkSavedStatus,
};
