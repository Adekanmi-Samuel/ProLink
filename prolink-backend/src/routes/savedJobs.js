const express = require('express');
const router = express.Router();
const savedJobsController = require('../controllers/savedJobsController');
const authMiddleware = require('../../middleware/authMiddleware');
const { apiLimiter } = require('../middleware/rateLimiter');

router.use(authMiddleware);
router.use(apiLimiter);

router.post('/', savedJobsController.saveJob);
router.get('/', savedJobsController.getSavedJobs);
router.get('/:jobId/status', savedJobsController.checkSavedStatus);
router.delete('/:jobId', savedJobsController.unsaveJob);

module.exports = router;
