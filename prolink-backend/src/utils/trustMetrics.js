const prisma = require('../config/prisma');

const calculateJobSuccessScore = async (profileId) => {
  const { total, completed } = await getCompletedJobsForProvider(profileId);
  if (total === 0) return null;
  return Math.round((completed / total) * 100);
};

const determineBadges = (successScore, completedProjectsCount, avgRating) => {
  const badges = [];
  if (completedProjectsCount >= 10 && successScore >= 90 && avgRating >= 4.5) badges.push('Top Rated');
  if (completedProjectsCount > 0 && successScore >= 100) badges.push('Flawless Execution');
  return badges;
};


const getCompletedJobsForProvider = async (profileId) => {
  // Since there's no "Project" model, use JobAssignment + Milestones
  const assignments = await prisma.jobAssignment.findMany({
    where: { provider_id: profileId },
    include: {
      job: {
        include: {
          milestones: { select: { status: true } }
        }
      }
    }
  });

  const total = assignments.length;
  const completed = assignments.filter(a =>
    a.job.status === 'completed' || a.job.milestones.some(m => m.status === 'paid' || m.status === 'approved')
  ).length;

  return { total, completed };
};

/**
 * Recalculate and persist trust metrics for a provider profile.
 * Called after a milestone is paid or a job status changes.
 */
const refreshProviderTrustMetrics = async (profileId) => {
  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    select: { user_id: true, rating_avg: true, review_count: true }
  });
  if (!profile) return;

  const { total, completed } = await getCompletedJobsForProvider(profile.user_id);
  const successScore = total > 0 ? Math.round((completed / total) * 100) : null;
  const avgRating = profile.rating_avg ? parseFloat(profile.rating_avg.toString()) : 0;
  const badges = determineBadges(successScore || 0, completed, avgRating);

  await prisma.profile.update({
    where: { id: profileId },
    data: {
      job_success_score: successScore,
      badges
    }
  });

  return { successScore, badges, completedProjects: completed, totalProjects: total };
};

module.exports = { calculateJobSuccessScore, determineBadges, refreshProviderTrustMetrics, getCompletedJobsForProvider };
