const jobsService = require('../services/jobsService');
const emailService = require('../services/emailService');
const { jobSchema, bidSchema } = require('../validators/jobValidator');
const logger = require('../config/logger');

const createJob = async (req, res, next) => {
  try {
    const clientId = req.user.id;
    const body = req.validatedBody || req.body;

    const { title, description, budget, job_type, payment_type, category_id, state, city, skillIds } = body;

    const job = await jobsService.createJob(clientId, { title, description, budget, job_type, payment_type, category_id, state, city, skillIds });
    
    const io = req.app.get('io');
    if (io) {
      io.to('global_updates').emit('global_notification', {
        id: job.id,
        title: 'New Job Posted',
        message: `${title} (${job_type}) for \u20A6${budget}`
      });
    }

    res.status(201).json({ msg: 'Job posted successfully!', job });
  } catch (err) {
    logger.error('createJob error:', err);
    res.status(500).json({ error: err.message });
  }
};

const getPublicJobs = async (req, res, next) => {
  try {
    const userId = req.user?.id || null;
    const { q, minBudget, maxBudget, categoryId, state, city, jobType, page, limit } = req.query;
    const filters = {
      q: q ? String(q) : undefined,
      minBudget: minBudget ? parseFloat(minBudget) : undefined,
      maxBudget: maxBudget ? parseFloat(maxBudget) : undefined,
      categoryId: categoryId ? parseInt(categoryId) : undefined,
      state: state ? String(state) : undefined,
      city: city ? String(city) : undefined,
      jobType: jobType ? String(jobType) : undefined,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    };

    const result = await jobsService.getPublicJobs(userId, filters);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
};

const getMyJobs = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await jobsService.getMyJobs(req.user.id, { page, limit });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
};

const getMyBids = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await jobsService.getMyBids(req.user.id, { page, limit });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
};

const getJobById = async (req, res, next) => {
  try {
    const userId = req.user?.id || null;
    const job = await jobsService.getJobById(parseInt(req.params.id), userId);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
};

const prisma = require('../config/prisma');

const submitBid = async (req, res, next) => {
  try {
    const parseResult = bidSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.errors[0].message });
    }
    const { amount, duration_days, proposal } = parseResult.data;
    const bid = await jobsService.submitBid(parseInt(req.params.id), req.user.id, { amount, duration_days, proposal });
    
    // Fetch job to get client_id
    const job = await prisma.job.findUnique({ where: { id: parseInt(req.params.id) } });
    
    if (job) {
      const io = req.app.get('io');
      if (io) {
        io.to(`user_${job.client_id}`).emit('bid_update', {
          jobId: job.id,
          bidId: bid.id,
          amount
        });
      }

      // Send email notification to client
      try {
        const client = await prisma.user.findUnique({ where: { id: job.client_id } });
        const providerProfile = await prisma.profile.findUnique({ where: { user_id: req.user.id } });
        const frontendUrl = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';

        if (client && client.email) {
          await emailService.sendBidReceivedEmail(
            client.email,
            job.title,
            providerProfile?.full_name || 'A freelancer',
            parseFloat(amount),
            `${frontendUrl}/jobs/${job.id}`
          );
        }
      } catch (emailErr) {
        logger.error('Failed to send bid received email', { error: emailErr.message });
      }
    }
    
    res.status(201).json({ msg: 'Bid submitted!', bid });
  } catch (err) {
    if (
      err.message === 'You have already placed a bid on this job.' ||
      err.message.startsWith('Bid amount must be at least') ||
      err.message === 'Bid amount must be greater than 0.' ||
      err.message === 'Proposal must be at least 20 characters long.' ||
      err.message === 'You cannot interact with this user.' ||
      err.message === 'Job not found.'
    ) {
      return res.status(400).json({ error: err.message });
    }
    logger.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
};

const hireProvider = async (req, res, next) => {
  try {
    const { providerId, agreedAmount } = req.body;
    if (!providerId) return res.status(400).json({ error: 'providerId is required.' });
    if (!agreedAmount || isNaN(Number(agreedAmount))) return res.status(400).json({ error: 'Valid agreedAmount is required.' });
    
    const assignment = await jobsService.hireProvider(parseInt(req.params.id), req.user.id, { providerId: parseInt(providerId), agreedAmount: Number(agreedAmount) });
    
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${providerId}`).emit('global_notification', {
        title: 'You were hired!',
        message: `A client just hired you for a job!`
      });
    }

    try {
      const provider = await prisma.user.findUnique({ where: { id: providerId } });
      const clientProfile = await prisma.profile.findUnique({ where: { user_id: req.user.id } });
      const job = await prisma.job.findUnique({ where: { id: parseInt(req.params.id) } });
      
      if (provider && provider.email && job) {
        await emailService.sendHiredEmail(provider.email, job.title, clientProfile?.full_name || 'A client');
      }
    } catch (emailErr) {
      logger.error('Failed to send hired email', { error: emailErr.message });
    }

    res.status(200).json({ msg: 'Freelancer hired!', assignment });
  } catch (err) {
    if (err.message === 'Job not found.') return res.status(404).json({ error: err.message });
    if (err.message === 'Not authorized.') return res.status(403).json({ error: err.message });
    if (err.message === 'Job is not open for hiring.') return res.status(400).json({ error: err.message });
    logger.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
};

const completeJob = async (req, res, next) => {
  try {
    const job = await jobsService.completeJob(parseInt(req.params.id), req.user.id);
    
    const io = req.app.get('io');
    if (io) {
      // Find the provider
      const assignment = await prisma.jobAssignment.findFirst({ where: { job_id: job.id } });
      if (assignment) {
        io.to(`user_${assignment.provider_id}`).emit('global_notification', {
          title: 'Job Completed',
          message: `The job "${job.title}" was marked as completed by the client.`
        });
      }
    }

    res.json({ msg: 'Job marked as completed.', job });
  } catch (err) {
    if (err.message === 'Job not found.') return res.status(404).json({ error: err.message });
    if (err.message === 'Not authorized.') return res.status(403).json({ error: err.message });
    if (err.message === 'Job cannot be completed in its current state.') return res.status(400).json({ error: err.message });
    logger.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
};

const cancelJob = async (req, res, next) => {
  try {
    const job = await jobsService.cancelJob(parseInt(req.params.id), req.user.id);
    res.json({ msg: 'Job cancelled successfully.', job });
  } catch (err) {
    if (err.message === 'Job not found.') return res.status(404).json({ error: err.message });
    if (err.message === 'Not authorized.') return res.status(403).json({ error: err.message });
    if (err.message === 'Only open jobs can be cancelled.') return res.status(400).json({ error: err.message });
    logger.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
};

const withdrawBid = async (req, res, next) => {
  try {
    const jobId = parseInt(req.params.id);
    const providerId = req.user.id;

    const bid = await prisma.bid.findUnique({
      where: { job_id_provider_id: { job_id: jobId, provider_id: providerId } },
      include: { job: true }
    });

    if (!bid) return res.status(404).json({ error: 'Bid not found.' });
    if (bid.job.status !== 'open') return res.status(400).json({ error: 'Cannot withdraw a bid on a job that is no longer open.' });

    await prisma.bid.delete({
      where: { job_id_provider_id: { job_id: jobId, provider_id: providerId } }
    });

    res.json({ msg: 'Bid withdrawn successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
};

const updateJob = async (req, res, next) => {
  try {
    const jobId = parseInt(req.params.id);
    const { title, description, budget, skillIds } = req.body;

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) return res.status(404).json({ error: 'Job not found.' });
    if (job.client_id !== req.user.id) return res.status(403).json({ error: 'Not authorized.' });
    if (job.status !== 'open') return res.status(400).json({ error: 'Only open jobs can be edited.' });

    const updated = await prisma.job.update({
      where: { id: jobId },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(budget !== undefined && { budget: parseFloat(budget) }),
      }
    });

    if (skillIds !== undefined) {
      await prisma.jobSkill.deleteMany({ where: { job_id: jobId } });
      if (skillIds.length > 0) {
        await prisma.jobSkill.createMany({
          data: skillIds.map((skill_id) => ({ job_id: jobId, skill_id }))
        });
      }
    }

    res.json({ msg: 'Job updated.', job: updated });
  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
};

const closeJob = async (req, res, next) => {
  try {
    const jobId = parseInt(req.params.id);
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) return res.status(404).json({ error: 'Job not found.' });
    if (job.client_id !== req.user.id) return res.status(403).json({ error: 'Not authorized.' });
    if (job.status !== 'open') return res.status(400).json({ error: 'Only open jobs can be closed.' });

    await prisma.job.update({ where: { id: jobId }, data: { status: 'closed' } });
    res.json({ msg: 'Job closed successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
};

const deleteJob = async (req, res) => {
  const jobId = parseInt(req.params.id, 10);
  const clientId = req.user.id;

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  if (job.client_id !== clientId) {
    return res.status(403).json({ error: 'Not authorized to delete this job' });
  }

  if (job.status !== 'open') {
    return res.status(400).json({ error: 'Only open jobs can be deleted. Please cancel or close the job instead.' });
  }

  await prisma.job.delete({ where: { id: jobId } });

  res.json({ msg: 'Job deleted successfully' });
};

module.exports = {
  createJob,
  getPublicJobs,
  getMyJobs,
  getJobById,
  updateJob,
  closeJob,
  submitBid,
  getMyBids,
  hireProvider,
  completeJob,
  withdrawBid,
  cancelJob,
  deleteJob
};
