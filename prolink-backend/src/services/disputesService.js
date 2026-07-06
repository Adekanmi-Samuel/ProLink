const prisma = require('../config/prisma');
const paymentsService = require('./paymentsService');

const createDispute = async (milestoneId, initiatorId, reason) => {
  // Ensure milestone is funded/submitted
  const milestone = await prisma.milestone.findUnique({ where: { id: milestoneId } });
  if (!milestone) throw new Error('Milestone not found');
  if (milestone.status !== 'funded' && milestone.status !== 'submitted') {
    throw new Error('Can only dispute funded or submitted milestones');
  }

  // Create dispute with 3-day response deadline
  const dispute = await prisma.dispute.create({
    data: {
      milestone_id: milestoneId,
      initiator_id: initiatorId,
      reason,
      status: 'open',
      response_deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days out
    }
  });

  // Mark milestone as disputed
  await prisma.milestone.update({
    where: { id: milestoneId },
    data: { status: 'disputed' }
  });

  return dispute;
};

const getDisputes = async () => {
  return await prisma.dispute.findMany({
    orderBy: { created_at: 'desc' },
    include: {
      milestone: { include: { job: true } },
      initiator: { include: { profile: true } }
    }
  });
};

const resolveDispute = async (disputeId, resolution, adminNotes, splitPercentage) => {
  const dispute = await prisma.dispute.findUnique({ where: { id: disputeId } });
  if (!dispute) throw new Error('Dispute not found');

  if (resolution === 'refund_client') {
    await paymentsService.refundClient(dispute.milestone_id);
    await prisma.dispute.update({
      where: { id: disputeId },
      data: { status: 'resolved_refunded', admin_notes: adminNotes }
    });
  } else if (resolution === 'release_provider') {
    await paymentsService.releaseFunds(dispute.milestone_id);
    await prisma.dispute.update({
      where: { id: disputeId },
      data: { status: 'resolved_released', admin_notes: adminNotes }
    });
  } else if (resolution === 'split') {
    if (!splitPercentage || splitPercentage < 0 || splitPercentage > 100) {
      throw new Error('splitPercentage must be between 0 and 100');
    }
    await paymentsService.resolveSplitPayment(dispute.milestone_id, splitPercentage);
    await prisma.dispute.update({
      where: { id: disputeId },
      data: { status: 'resolved_split', admin_notes: adminNotes, split_percentage: splitPercentage }
    });
  } else {
    throw new Error('Invalid resolution');
  }

  return { success: true };
};

const getMyDisputes = async (userId) => {
  return await prisma.dispute.findMany({
    where: {
      OR: [
        { initiator_id: userId },
        {
          milestone: {
            job: {
              OR: [
                { client_id: userId },
                { assignment: { provider_id: userId } }
              ]
            }
          }
        }
      ]
    },
    include: {
      milestone: {
        include: {
          job: {
            select: { title: true, client_id: true, assignment: true }
          }
        }
      },
      initiator: {
        select: { profile: { select: { full_name: true } } }
      }
    },
    orderBy: { created_at: 'desc' }
  });
};

const addEvidence = async (disputeId, userId, note, fileUrl) => {
  return await prisma.disputeEvidence.create({
    data: { dispute_id: disputeId, submitted_by: userId, note, file_url: fileUrl }
  });
};

const getDisputeDetail = async (disputeId) => {
  const dispute = await prisma.dispute.findUnique({
    where: { id: disputeId },
    include: {
      milestone: { include: { job: { include: { assignment: true, client: true } } } },
      initiator: { include: { profile: true } },
      evidence: { include: { submitter: { include: { profile: true } } }, orderBy: { created_at: 'asc' } }
    }
  });
  if (!dispute) return null;

  // Pull in the job's chat history automatically so the admin sees the full
  // conversation without either party needing to manually screenshot anything.
  const thread = await prisma.chatThread.findFirst({ where: { job_id: dispute.milestone.job_id } });
  const messages = thread
    ? await prisma.message.findMany({
        where: { thread_id: thread.id },
        include: { sender: { include: { profile: true } } },
        orderBy: { sent_at: 'asc' }
      })
    : [];

  const isWithinResponseWindow = dispute.response_deadline ? new Date() < dispute.response_deadline : false;

  return { ...dispute, chatHistory: messages, isWithinResponseWindow };
};

module.exports = {
  createDispute,
  getDisputes,
  resolveDispute,
  getMyDisputes,
  addEvidence,
  getDisputeDetail
};
