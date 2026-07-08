const prisma = require('../config/prisma');
const { createNotification } = require('./notificationService');

const createJob = async (clientId, { title, description, budget, job_type, payment_type, category_id, state, city, skillIds }) => {
  const job = await prisma.job.create({
    data: { client_id: clientId, title, description, budget, job_type, payment_type, category_id, state, city },
  });

  if (skillIds && skillIds.length > 0) {
    await prisma.jobSkill.createMany({
      data: skillIds.map(skill_id => ({ job_id: job.id, skill_id }))
    });
  }

  return job;
};

const getPublicJobs = async (userId, filters = {}) => {
  let blockedUserIds = [];
  
  if (userId) {
    const blocks = await prisma.block.findMany({
      where: {
        OR: [
          { blocker_id: userId },
          { blocked_id: userId }
        ]
      }
    });
    
    blockedUserIds = blocks.map(b => b.blocker_id === userId ? b.blocked_id : b.blocker_id);
  }

  const { q, minBudget, maxBudget, categoryId, jobType } = filters;

  const whereClause = {
    client_id: { notIn: blockedUserIds },
    status: 'open'
  };

  if (jobType) whereClause.job_type = jobType;
  if (q) {
    whereClause.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } }
    ];
  }
  if (minBudget !== undefined || maxBudget !== undefined) {
    whereClause.budget = {};
    if (minBudget !== undefined) whereClause.budget.gte = parseFloat(minBudget);
    if (maxBudget !== undefined) whereClause.budget.lte = parseFloat(maxBudget);
  }
  if (categoryId) whereClause.category_id = parseInt(categoryId);
  if (filters.state) whereClause.state = filters.state;
  if (filters.city) whereClause.city = { contains: filters.city, mode: 'insensitive' };

  // Pagination
  const page = Math.max(1, parseInt(filters.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(filters.limit) || 20));
  const skip = (page - 1) * limit;

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where: whereClause,
      orderBy: { posted_at: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        description: true,
        budget: true,
        posted_at: true,
        state: true,
        city: true,
        job_type: true,
        client: { select: { profile: { select: { full_name: true } } } },
        category: { select: { name: true, icon: true } },
      },
    }),
    prisma.job.count({ where: whereClause }),
  ]);

  // If user is authenticated, fetch saved job IDs in bulk
  let savedJobIds = new Set();
  if (userId) {
    const savedJobs = await prisma.savedJob.findMany({
      where: { user_id: userId },
      select: { job_id: true },
    });
    savedJobIds = new Set(savedJobs.map(sj => sj.job_id));
  }

  return {
    jobs: jobs.map(j => ({
      id: j.id,
      title: j.title,
      description: j.description?.substring(0, 200),
      budget: j.budget,
      posted_at: j.posted_at,
      state: j.state,
      city: j.city,
      job_type: j.job_type,
      client_name: j.client?.profile?.full_name,
      category_name: j.category?.name,
      category_icon: j.category?.icon,
      isSaved: savedJobIds.has(j.id),
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

const getMyJobs = async (userId, filters = {}) => {
  const page = Math.max(1, parseInt(filters.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(filters.limit) || 20));
  const skip = (page - 1) * limit;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { user_type: true },
  });
  
  if (user.user_type === 'provider') {
    const whereClause = {
      OR: [
        { assignment: { provider_id: userId } },
        { bids: { some: { provider_id: userId } } }
      ]
    };

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where: whereClause,
        orderBy: { posted_at: 'desc' },
        skip,
        take: limit,
        select: {
          id: true, title: true, budget: true, job_type: true, status: true, posted_at: true,
          _count: { select: { bids: true } },
        },
      }),
      prisma.job.count({ where: whereClause })
    ]);
    
    return {
      jobs: jobs.map(job => ({ ...job, bid_count: job._count.bids, _count: undefined })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasMore: page * limit < total },
    };
  } else {
    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where: { client_id: userId },
        orderBy: { posted_at: 'desc' },
        skip,
        take: limit,
        select: {
          id: true, title: true, description: true, budget: true, job_type: true, status: true, posted_at: true, state: true, city: true,
          _count: { select: { bids: true } },
          category: { select: { name: true, icon: true } },
        },
      }),
      prisma.job.count({ where: { client_id: userId } }),
    ]);
    return {
      jobs: jobs.map(job => ({ ...job, bid_count: job._count.bids, _count: undefined })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasMore: page * limit < total },
    };
  }
};

const getMyBids = async (userId, filters = {}) => {
  const page = Math.max(1, parseInt(filters.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(filters.limit) || 20));
  const skip = (page - 1) * limit;

  const [bids, total] = await Promise.all([
    prisma.bid.findMany({
      where: { provider_id: userId },
      orderBy: { submitted_at: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        amount: true,
        proposal: true,
        submitted_at: true,
        job: {
          select: {
            id: true,
            title: true,
            budget: true,
            job_type: true,
            status: true,
            client: { select: { profile: { select: { full_name: true } } } },
            category: { select: { name: true } },
            assignment: { select: { provider_id: true } },
          },
        },
      },
    }),
    prisma.bid.count({ where: { provider_id: userId } }),
  ]);

  return {
    bids: bids.map(bid => {
      let status = 'pending';
      if (bid.job.status === 'assigned' || bid.job.status === 'completed') {
        status = bid.job.assignment?.provider_id === userId ? 'accepted' : 'rejected';
      } else if (bid.job.status === 'cancelled') {
        status = 'rejected';
      }

      return {
        id: bid.id,
        amount: bid.amount,
        proposal: bid.proposal,
        submitted_at: bid.submitted_at,
        status,
        job: {
          id: bid.job.id,
          title: bid.job.title,
          budget: bid.job.budget,
          job_type: bid.job.job_type,
          client_name: bid.job.client?.profile?.full_name || 'Client',
        },
      };
    }),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasMore: page * limit < total },
  };
};

const getJobById = async (jobId, userId) => {
  // First, fetch the job basics to check ownership
  const ownershipCheck = await prisma.job.findUnique({
    where: { id: jobId },
    select: { client_id: true },
  });
  if (!ownershipCheck) return null;

  const isOwner = ownershipCheck.client_id === userId;

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      client_id: true,
      title: true,
      description: true,
      budget: true,
      posted_at: true,
      status: true,
      client: { select: { profile: { select: { full_name: true } } } },
      category: true,
      assignment: {
        select: {
          id: true,
          provider_id: true,
          agreed_amount: true,
          assigned_at: true,
          provider: { select: { profile: { select: { full_name: true, profile_picture_url: true } } } },
        },
      },
      bids: isOwner ? {
        select: {
          id: true,
          provider_id: true,
          amount: true,
          proposal: true,
          submitted_at: true,
          provider: { select: { profile: { select: { full_name: true, profile_picture_url: true } } } },
        },
      } : false,
      skills: { include: { skill: true } },
      _count: true,
    },
  });
  if (!job) return null;

  return {
    id: job.id,
    client_id: job.client_id,
    title: job.title,
    description: job.description,
    budget: job.budget,
    posted_at: job.posted_at,
    status: job.status,
    client_name: job.client?.profile?.full_name,
    category: job.category,
    skills: job.skills?.map(s => s.skill) ?? [],
    bids: isOwner
      ? job.bids.map(b => ({
          id: b.id,
          provider_id: b.provider_id,
          amount: b.amount,
          proposal: b.proposal,
          submitted_at: b.submitted_at,
          full_name: b.provider?.profile?.full_name,
          profile_picture_url: b.provider?.profile?.profile_picture_url,
        }))
      : undefined,
    assignment: job.assignment,
  };
};

const submitBid = async (jobId, providerId, { amount, proposal }) => {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw new Error('Job not found.');

  // Check blocks
  const block = await prisma.block.findFirst({
    where: {
      OR: [
        { blocker_id: job.client_id, blocked_id: providerId },
        { blocker_id: providerId, blocked_id: job.client_id }
      ]
    }
  });
  if (block) throw new Error('You cannot interact with this user.');

  const MIN_BID = parseFloat(process.env.MIN_BID_AMOUNT || '500');
  if (parseFloat(amount) < MIN_BID) throw new Error(`Bid amount must be at least ₦${MIN_BID.toLocaleString()}.`);
  if (proposal.trim().length < 20) throw new Error('Proposal must be at least 20 characters long.');

  const existing = await prisma.bid.findFirst({
    where: { job_id: jobId, provider_id: providerId },
  });
  if (existing) throw new Error('You have already placed a bid on this job.');
  
  const bid = await prisma.bid.create({
    data: { job_id: jobId, provider_id: providerId, amount, proposal },
  });

  // Notify job owner about new bid
  createNotification(job.client_id, 'new_bid', `A new bid of ₦${amount} was placed on your job "${job.title}"`, `/dashboard/jobs/${jobId}`).catch(console.error);

  return bid;
};

const hireProvider = async (jobId, clientId, { providerId, agreedAmount }) => {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw new Error('Job not found.');
  if (job.client_id !== clientId) throw new Error('Not authorized.');
  if (job.status !== 'open') throw new Error('Job is not open for hiring.');

  return await prisma.$transaction(async (tx) => {
    await tx.job.update({ where: { id: jobId }, data: { status: 'assigned' } });
    return await tx.jobAssignment.create({
      data: { job_id: jobId, provider_id: providerId, agreed_amount: agreedAmount },
    });
  });
};

const completeJob = async (jobId, clientId) => {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw new Error('Job not found.');
  if (job.client_id !== clientId) throw new Error('Not authorized.');
  if (job.status !== 'assigned') throw new Error('Job cannot be completed in its current state.');

  return await prisma.job.update({
    where: { id: jobId },
    data: { status: 'completed' },
  });
};

const cancelJob = async (jobId, clientId) => {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw new Error('Job not found.');
  if (job.client_id !== clientId) throw new Error('Not authorized.');
  if (job.status !== 'open') throw new Error('Only open jobs can be cancelled.');

  const cancelled = await prisma.job.update({
    where: { id: jobId, client_id: clientId },
    data: { status: 'cancelled' }
  });
};

module.exports = {
  createJob,
  getPublicJobs,
  getMyJobs,
  getMyBids,
  getJobById,
  submitBid,
  hireProvider,
  completeJob,
  cancelJob
};