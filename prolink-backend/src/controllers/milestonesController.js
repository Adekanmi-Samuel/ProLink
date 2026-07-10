const milestonesService = require('../services/milestonesService');
const emailService = require('../services/emailService');
const paymentsService = require('../services/paymentsService');
const prisma = require('../config/prisma');
const { createNotification } = require('../services/notificationService');
const { refreshProviderTrustMetrics } = require('../utils/trustMetrics');
const logger = require('../config/logger');

const createMilestone = async (req, res, next) => {
  try {
    const { jobId, title, amount } = req.body;
    if (!jobId || !title || !amount) {
      return res.status(400).json({ msg: 'jobId, title, and amount are required' });
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ msg: 'Milestone amount must be greater than 0' });
    }
    
    // Verify user is the client of the job
    const job = await prisma.job.findUnique({ where: { id: parseInt(jobId) } });
    if (!job || job.client_id !== req.user.id) {
      return res.status(403).json({ msg: 'Unauthorized or job not found' });
    }

    const milestone = await milestonesService.createMilestone(parseInt(jobId), title, parsedAmount);
    res.status(201).json(milestone);
  } catch (error) {
    res.status(500).json({ msg: 'Failed to create milestone' });
  }
};

const getMilestones = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const milestones = await milestonesService.getMilestonesByJob(parseInt(jobId));
    res.json(milestones);
  } catch (error) {
    res.status(500).json({ msg: 'Failed to fetch milestones' });
  }
};

const submitMilestone = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if user is the assigned provider
    const milestone = await prisma.milestone.findUnique({ 
      where: { id: parseInt(id) },
      include: { job: { include: { assignment: true } } }
    });

    if (!milestone) return res.status(404).json({ msg: 'Milestone not found' });
    if (milestone.job.assignment?.provider_id !== req.user.id) {
      return res.status(403).json({ msg: 'Only the provider can submit a milestone' });
    }
    if (milestone.status !== 'funded' && milestone.status !== 'revision_requested') {
      return res.status(400).json({ msg: 'Milestone must be funded or in revision before submission' });
    }

    const updated = await milestonesService.submitMilestone(parseInt(id));

    try {
      const client = await prisma.user.findUnique({ where: { id: milestone.job.client_id } });
      const providerProfile = await prisma.profile.findUnique({ where: { user_id: req.user.id } });
      if (client && client.email) {
        await emailService.sendJobSubmittedEmail(
          client.email,
          milestone.job.title,
          providerProfile?.full_name || 'Your freelancer'
        );
      }
    } catch (emailErr) {
      }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ msg: 'Failed to submit milestone' });
  }
};

const approveMilestone = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if user is the client
    const milestone = await prisma.milestone.findUnique({ 
      where: { id: parseInt(id) },
      include: { job: { include: { assignment: true } } }
    });

    if (!milestone) return res.status(404).json({ msg: 'Milestone not found' });
    if (milestone.job.client_id !== req.user.id) {
      return res.status(403).json({ msg: 'Only the client can approve a milestone' });
    }
    if (milestone.status !== 'submitted') {
      return res.status(400).json({ msg: 'Milestone must be submitted before approval' });
    }

    await milestonesService.approveMilestone(parseInt(id));

    // THE FIX — actually release the held funds, don't just flip a status
    try {
      await paymentsService.releaseFunds(parseInt(id));
    } catch (payoutErr) {
      // Leave status as 'approved' (not 'paid') so it's visibly stuck, not silently lost.
      return res.status(207).json({
        msg: 'Milestone approved, but payout to provider failed and needs admin attention.',
        milestoneId: parseInt(id)
      });
    }

    const updated = await prisma.milestone.findUnique({ where: { id: parseInt(id) } });

    try {
      if (milestone.job.assignment?.provider_id) {
        const provider = await prisma.user.findUnique({ where: { id: milestone.job.assignment.provider_id } });
          if (provider && provider.email) {
            await emailService.sendFundsApprovedEmail(
              provider.email,
              milestone.job.title,
              milestone.amount
            );
            // Real-time notification
            createNotification(provider.id, 'milestone_approved', `Milestone "${milestone.title}" was approved — funds released!`, `/dashboard/contracts/${milestone.job_id}`).catch(err => logger.error('Failed to create notification', { error: err.message }));
          }
      }
    } catch (emailErr) {
      }

    // Refresh trust metrics (job success score + badges) for the provider
    if (milestone.job.assignment?.provider_id) {
      prisma.profile.findUnique({ where: { user_id: milestone.job.assignment.provider_id } })
        .then(profile => {
          if (profile) refreshProviderTrustMetrics(profile.id).catch(err => logger.error('Trust metrics refresh failed', { error: err.message }));
        })
        .catch(err => logger.error('Trust metrics profile lookup failed', { error: err.message }));
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ msg: 'Failed to approve milestone' });
  }
};

const requestRevision = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const milestone = await prisma.milestone.findUnique({
      where: { id: parseInt(id) },
      include: { job: { include: { assignment: true } } }
    });

    if (!milestone) return res.status(404).json({ msg: 'Milestone not found' });
    if (milestone.job.client_id !== req.user.id) {
      return res.status(403).json({ msg: 'Only the client can request a revision' });
    }
    if (milestone.status !== 'submitted') {
      return res.status(400).json({ msg: 'Can only request revision on a submitted milestone' });
    }

    const updated = await milestonesService.requestRevision(parseInt(id), notes);

    try {
      if (milestone.job.assignment?.provider_id) {
        const provider = await prisma.user.findUnique({ where: { id: milestone.job.assignment.provider_id } });
        if (provider && provider.email) {
          await emailService.sendRevisionRequestedEmail(provider.email, milestone.job.title, notes);
        }
      }
    } catch (emailErr) {
      }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ msg: 'Failed to request revision' });
  }
};


const deleteMilestone = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if user is the client
    const milestone = await prisma.milestone.findUnique({ 
      where: { id: parseInt(id) },
      include: { job: true }
    });

    if (!milestone) return res.status(404).json({ msg: 'Milestone not found' });
    if (milestone.job.client_id !== req.user.id) {
      return res.status(403).json({ msg: 'Only the client can delete a milestone' });
    }
    if (milestone.status === 'submitted' || milestone.status === 'approved') {
      return res.status(400).json({ msg: 'Cannot delete a milestone that is submitted or approved' });
    }

    await milestonesService.deleteMilestone(parseInt(id));
    res.json({ msg: 'Milestone deleted successfully' });
  } catch (error) {
    res.status(500).json({ msg: 'Failed to delete milestone' });
  }
};

module.exports = {
  createMilestone,
  getMilestones,
  submitMilestone,
  approveMilestone,
  requestRevision,
  deleteMilestone
};
