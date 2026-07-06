const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../../middleware/authMiddleware');
const requireAdmin = require('../middleware/requireAdmin');
const { apiLimiter } = require('../middleware/rateLimiter');

// All admin routes require authentication and admin role
router.use(authMiddleware);
router.use(apiLimiter);
router.use(requireAdmin);

// Verifications
router.get('/verifications', adminController.getPendingVerifications);
router.post('/verifications/review', adminController.reviewVerification);

// Users
router.get('/users', adminController.getUsers);
router.patch('/users/:id/status', adminController.updateUserStatus);

// Jobs
router.get('/jobs', adminController.getJobs);
router.delete('/jobs/:id', adminController.deleteJob);

// Disputes — reuse disputes controller, admin can list/resolve all
const disputesController = require('../controllers/disputesController');
router.get('/disputes', disputesController.getDisputes);
router.patch('/disputes/:id/resolve', disputesController.resolveDispute);

module.exports = router;
