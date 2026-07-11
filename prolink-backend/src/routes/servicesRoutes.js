const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/authMiddleware');
const { getServices, getServiceById, createService, getMyServices, purchaseService } = require('../controllers/servicesController');

router.get('/', getServices);
router.get('/my', requireAuth, getMyServices);
router.get('/:id', getServiceById);
router.post('/', requireAuth, createService);
router.post('/purchase', requireAuth, purchaseService);

module.exports = router;
