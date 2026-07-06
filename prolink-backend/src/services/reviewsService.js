const prisma = require('../config/prisma');

const submitReview = async (jobId, reviewerId, rating, comment) => {
  // 1. Fetch the job to ensure it exists and is completed
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { assignment: true }
  });

  if (!job) throw new Error('Job not found.');
  if (job.status !== 'completed') throw new Error('Job must be completed to leave a review.');

  // 2. Validate reviewer was part of the job
  let revieweeId;
  if (job.client_id === reviewerId) {
    if (!job.assignment) throw new Error('No provider assigned to this job.');
    revieweeId = job.assignment.provider_id;
  } else if (job.assignment?.provider_id === reviewerId) {
    revieweeId = job.client_id;
  } else {
    throw new Error('Not authorized to leave a review for this job.');
  }

  // 3. Ensure a review hasn't already been left by this user for this job
  const existingReview = await prisma.review.findUnique({
    where: {
      job_id_reviewer_id_reviewee_id: {
        job_id: jobId,
        reviewer_id: reviewerId,
        reviewee_id: revieweeId
      }
    }
  });

  if (existingReview) throw new Error('You have already left a review for this job.');

  // 4. Create the review
  const review = await prisma.review.create({
    data: {
      job_id: jobId,
      reviewer_id: reviewerId,
      reviewee_id: revieweeId,
      rating,
      comment
    }
  });

  // 5. Recalculate average rating for reviewee
  const allReviews = await prisma.review.findMany({
    where: { reviewee_id: revieweeId },
    select: { rating: true }
  });

  const reviewCount = allReviews.length;
  const ratingAvg = allReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount;

  await prisma.profile.update({
    where: { user_id: revieweeId },
    data: {
      rating_avg: parseFloat(ratingAvg.toFixed(2)),
      review_count: reviewCount
    }
  });

  return review;
};

const getReviewsForUser = async (userId) => {
  return await prisma.review.findMany({
    where: { reviewee_id: userId },
    include: {
      reviewer: {
        include: { profile: { select: { full_name: true, profile_picture_url: true } } }
      },
      job: { select: { title: true } }
    },
    orderBy: { created_at: 'desc' }
  });
};

module.exports = {
  submitReview,
  getReviewsForUser
};
