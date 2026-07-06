const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/authMiddleware');
const requireAdmin = require('../middleware/requireAdmin');
const disputesController = require('../controllers/disputesController');
const { apiLimiter } = require('../middleware/rateLimiter');

router.use(authMiddleware);
router.use(apiLimiter);

router.post('/', disputesController.createDispute);
router.get('/my-disputes', disputesController.getMyDisputes);

// Dispute detail & evidence (either party)
router.get('/:id', disputesController.getDisputeDetail);
router.post('/:id/evidence', disputesController.addEvidence);

// Admin routes
router.get('/', requireAdmin, disputesController.getDisputes);
router.patch('/:id/resolve', requireAdmin, disputesController.resolveDispute);

module.exports = router;
