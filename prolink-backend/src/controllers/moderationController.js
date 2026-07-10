const prisma = require('../config/prisma');
const emailService = require('../services/emailService');
const logger = require('../config/logger');

const blockUser = async (req, res, next) => {
  try {
    const blockerId = req.user.id;
    const { blockedId } = req.body;

    if (!blockedId) return res.status(400).json({ error: 'Blocked user ID is required' });
    if (blockerId === parseInt(blockedId)) return res.status(400).json({ error: 'You cannot block yourself' });

    const block = await prisma.block.create({
      data: {
        blocker_id: blockerId,
        blocked_id: parseInt(blockedId),
      }
    });

    try {
      const blocker = await prisma.user.findUnique({ where: { id: blockerId } });
      const blockedProfile = await prisma.profile.findUnique({ where: { user_id: parseInt(blockedId) } });
      if (blocker && blocker.email) {
        await emailService.sendBlockEmail(blocker.email, blockedProfile?.full_name || 'a user');
      }
    } catch (emailErr) {
      }

    res.status(201).json({ message: 'User blocked successfully', block });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'You have already blocked this user' });
    }
    logger.error('Error blocking user', { error: error.message });
    res.status(500).json({ error: 'Server error' });
  }
};

const unblockUser = async (req, res, next) => {
  try {
    const blockerId = req.user.id;
    const { blockedId } = req.params;

    await prisma.block.deleteMany({
      where: {
        blocker_id: blockerId,
        blocked_id: parseInt(blockedId)
      }
    });

    res.json({ message: 'User unblocked successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const reportUser = async (req, res, next) => {
  try {
    const reporterId = req.user.id;
    const { reportedUserId, jobId, messageId, reason } = req.body;

    if (!reason) return res.status(400).json({ error: 'Reason is required' });

    const report = await prisma.report.create({
      data: {
        reporter_id: reporterId,
        reported_user_id: reportedUserId ? parseInt(reportedUserId) : null,
        job_id: jobId ? parseInt(jobId) : null,
        message_id: messageId ? parseInt(messageId) : null,
        reason
      }
    });

    try {
      const reporter = await prisma.user.findUnique({ where: { id: reporterId } });
      let targetName = 'a job/message';
      if (reportedUserId) {
        const targetProfile = await prisma.profile.findUnique({ where: { user_id: parseInt(reportedUserId) } });
        if (targetProfile) targetName = targetProfile.full_name;
      }
      if (reporter && reporter.email) {
        await emailService.sendReportEmail(reporter.email, targetName, reason);
      }
    } catch (emailErr) {
      }

    res.status(201).json({ message: 'Report submitted successfully', report });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  blockUser,
  unblockUser,
  reportUser
};
