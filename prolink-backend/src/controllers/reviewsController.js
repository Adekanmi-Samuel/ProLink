const reviewsService = require('../services/reviewsService');
const logger = require('../config/logger');

const submitReview = async (req, res, next) => {
  try {
    const { jobId, rating, comment } = req.body;
    
    if (!jobId || !rating) {
      return res.status(400).json({ msg: 'Job ID and Rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ msg: 'Rating must be between 1 and 5' });
    }

    const review = await reviewsService.submitReview(parseInt(jobId), req.user.id, parseInt(rating), comment);
    res.status(201).json({ msg: 'Review submitted successfully', review });
  } catch (error) {
    if (
      error.message === 'Job not found.' ||
      error.message === 'Job must be completed to leave a review.' ||
      error.message === 'No provider assigned to this job.' ||
      error.message === 'Not authorized to leave a review for this job.' ||
      error.message === 'You have already left a review for this job.'
    ) {
      return res.status(400).json({ msg: error.message });
    }
    
    logger.error('Error submitting review', { error: error.message });
    res.status(500).json({ msg: 'Server error while submitting review' });
  }
};

const getReviewsForUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const reviews = await reviewsService.getReviewsForUser(parseInt(userId));
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ msg: 'Server error while fetching reviews' });
  }
};

module.exports = {
  submitReview,
  getReviewsForUser
};
