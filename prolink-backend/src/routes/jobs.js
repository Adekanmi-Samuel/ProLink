const express = require('express');
const jobsController = require('../controllers/jobsController');
const authMiddleware = require('../middleware/authMiddleware');
const requireVerified = require('../middleware/requireVerified');
const requireClient = require('../middleware/requireClient');
const requireProvider = require('../middleware/requireProvider');
const { apiLimiter, searchLimiter } = require('../middleware/rateLimiter');
const { validateRequest, asyncHandler } = require('../middleware/validationMiddleware');
const { jobSchema, bidSchema, jobAssignmentSchema } = require('../validators/jobValidator');

const router = express.Router();

router.post('/', authMiddleware, apiLimiter, requireVerified, requireClient, validateRequest(jobSchema, 'body'), asyncHandler(jobsController.createJob));
router.get('/', searchLimiter, asyncHandler(jobsController.getPublicJobs));
router.get('/my-jobs', authMiddleware, apiLimiter, asyncHandler(jobsController.getMyJobs));
router.get('/my-bids', authMiddleware, apiLimiter, requireProvider, asyncHandler(jobsController.getMyBids));
router.get('/:id', asyncHandler(jobsController.getJobById));
router.delete('/:id', authMiddleware, apiLimiter, requireClient, asyncHandler(jobsController.deleteJob));
router.post('/:id/bids', authMiddleware, apiLimiter, requireVerified, requireProvider, validateRequest(bidSchema, 'body'), asyncHandler(jobsController.submitBid));
router.delete('/:id/bids', authMiddleware, apiLimiter, requireProvider, asyncHandler(jobsController.withdrawBid));
router.post('/:id/hire', authMiddleware, apiLimiter, requireVerified, requireClient, validateRequest(jobAssignmentSchema, 'body'), asyncHandler(jobsController.hireProvider));
router.patch('/:id/complete', authMiddleware, apiLimiter, requireClient, asyncHandler(jobsController.completeJob));
router.patch('/:id/cancel', authMiddleware, apiLimiter, requireClient, asyncHandler(jobsController.cancelJob));
router.patch('/:id', authMiddleware, apiLimiter, requireClient, validateRequest(jobSchema, 'body'), asyncHandler(jobsController.updateJob));
router.patch('/:id/close', authMiddleware, apiLimiter, requireClient, asyncHandler(jobsController.closeJob));

module.exports = router;
