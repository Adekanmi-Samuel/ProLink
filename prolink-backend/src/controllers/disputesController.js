const disputesService = require('../services/disputesService');
const emailService = require('../services/emailService');
const prisma = require('../config/prisma');

const createDispute = async (req, res, next) => {
  try {
    const { milestoneId, reason } = req.body;
    
    // Verify user is either client or provider of the job
    const milestone = await prisma.milestone.findUnique({
      where: { id: parseInt(milestoneId) },
      include: { job: { include: { assignment: true } } }
    });

    if (!milestone) return res.status(404).json({ msg: 'Milestone not found' });

    const isClient = milestone.job.client_id === req.user.id;
    const isProvider = milestone.job.assignment?.provider_id === req.user.id;

    if (!isClient && !isProvider) {
      return res.status(403).json({ msg: 'Not authorized to dispute this milestone' });
    }

    const dispute = await disputesService.createDispute(parseInt(milestoneId), req.user.id, reason);

    try {
      const client = await prisma.user.findUnique({ where: { id: milestone.job.client_id } });
      let provider = null;
      if (milestone.job.assignment?.provider_id) {
        provider = await prisma.user.findUnique({ where: { id: milestone.job.assignment.provider_id } });
      }

      const targetUser = isClient ? provider : client;
      if (targetUser && targetUser.email) {
        await emailService.sendDisputeEmail(targetUser.email, dispute.id, isClient ? 'provider' : 'client', 'created');
      }
    } catch (emailErr) {
      }

    res.status(201).json(dispute);
  } catch (error) {
    res.status(500).json({ msg: error.message || 'Failed to create dispute' });
  }
};

const getDisputes = async (req, res, next) => {
  try {
    const disputes = await disputesService.getDisputes();
    res.json(disputes);
  } catch (error) {
    res.status(500).json({ msg: 'Failed to fetch disputes' });
  }
};

const resolveDispute = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { resolution, adminNotes, splitPercentage } = req.body;
    const updated = await disputesService.resolveDispute(parseInt(id), resolution, adminNotes, splitPercentage);

    try {
      const dispute = await prisma.dispute.findUnique({ 
        where: { id: parseInt(id) },
        include: { milestone: { include: { job: { include: { assignment: true } } } } }
      });
      if (dispute) {
        const client = await prisma.user.findUnique({ where: { id: dispute.milestone.job.client_id } });
        let provider = null;
        if (dispute.milestone.job.assignment?.provider_id) {
          provider = await prisma.user.findUnique({ where: { id: dispute.milestone.job.assignment.provider_id } });
        }
        if (client && client.email) await emailService.sendDisputeEmail(client.email, dispute.id, 'client', 'resolved');
        if (provider && provider.email) await emailService.sendDisputeEmail(provider.email, dispute.id, 'provider', 'resolved');
      }
    } catch (emailErr) {
      }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ msg: error.message || 'Failed to resolve dispute' });
  }
};

const addEvidence = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { note, fileUrl } = req.body;

    const dispute = await prisma.dispute.findUnique({
      where: { id: parseInt(id) },
      include: { milestone: { include: { job: { include: { assignment: true } } } } }
    });
    if (!dispute) return res.status(404).json({ msg: 'Dispute not found' });

    const isClient = dispute.milestone.job.client_id === req.user.id;
    const isProvider = dispute.milestone.job.assignment?.provider_id === req.user.id;
    if (!isClient && !isProvider) {
      return res.status(403).json({ msg: 'Not authorized to add evidence to this dispute' });
    }

    const evidence = await disputesService.addEvidence(parseInt(id), req.user.id, note, fileUrl);
    res.status(201).json(evidence);
  } catch (error) {
    res.status(500).json({ msg: 'Failed to add evidence' });
  }
};

const getDisputeDetail = async (req, res, next) => {
  try {
    const dispute = await disputesService.getDisputeDetail(parseInt(req.params.id));
    if (!dispute) return res.status(404).json({ msg: 'Dispute not found' });
    res.json(dispute);
  } catch (error) {
    res.status(500).json({ msg: 'Failed to fetch dispute' });
  }
};

const getMyDisputes = async (req, res, next) => {
  try {
    const disputes = await disputesService.getMyDisputes(req.user.id);
    res.json(disputes);
  } catch (error) {
    res.status(500).json({ msg: 'Failed to fetch your disputes' });
  }
};

module.exports = {
  createDispute,
  getDisputes,
  resolveDispute,
  getMyDisputes,
  addEvidence,
  getDisputeDetail
};
