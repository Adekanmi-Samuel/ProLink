const prisma = require('../config/prisma');

const createMilestone = async (jobId, title, amount) => {
  return await prisma.milestone.create({
    data: {
      job_id: jobId,
      title,
      amount,
      status: 'pending'
    }
  });
};

const getMilestonesByJob = async (jobId) => {
  return await prisma.milestone.findMany({
    where: { job_id: jobId },
    orderBy: { created_at: 'asc' }
  });
};

const updateMilestoneStatus = async (milestoneId, status) => {
  return await prisma.milestone.update({
    where: { id: milestoneId },
    data: { status }
  });
};

const submitMilestone = async (milestoneId) => {
  return await prisma.milestone.update({
    where: { id: milestoneId },
    data: { status: 'submitted', submitted_at: new Date() }
  });
};

const approveMilestone = async (milestoneId) => {
  return await updateMilestoneStatus(milestoneId, 'approved');
};

const requestRevision = async (milestoneId, notes) => {
  return await prisma.milestone.update({
    where: { id: milestoneId },
    data: { status: 'revision_requested', revision_notes: notes }
  });
};

const deleteMilestone = async (milestoneId) => {
  return await prisma.milestone.delete({
    where: { id: milestoneId }
  });
};

module.exports = {
  createMilestone,
  getMilestonesByJob,
  updateMilestoneStatus,
  submitMilestone,
  approveMilestone,
  requestRevision,
  deleteMilestone
};
