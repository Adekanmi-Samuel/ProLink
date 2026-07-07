const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const milestonesController = require('../controllers/milestonesController');
const requireClient = require('../middleware/requireClient');
const requireProvider = require('../middleware/requireProvider');
const { apiLimiter } = require('../middleware/rateLimiter');

router.use(authMiddleware);
router.use(apiLimiter);

router.post('/', requireClient, milestonesController.createMilestone);
router.get('/job/:jobId', milestonesController.getMilestones);
router.patch('/:id/submit', requireProvider, milestonesController.submitMilestone);
router.patch('/:id/approve', requireClient, milestonesController.approveMilestone);
router.patch('/:id/request-revision', requireClient, milestonesController.requestRevision);
router.delete('/:id', requireClient, milestonesController.deleteMilestone);

module.exports = router;

