const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/authMiddleware');
const requireProvider = require('../middleware/requireProvider');
const { apiLimiter } = require('../middleware/rateLimiter');
const { getServices, getServiceById, createService, getMyServices, purchaseService } = require('../controllers/servicesController');

router.get('/', getServices);
router.get('/my', requireAuth, getMyServices);
router.get('/:id', getServiceById);
router.post('/', requireAuth, apiLimiter, requireProvider, createService);
router.post('/purchase', requireAuth, apiLimiter, purchaseService);

module.exports = router;
