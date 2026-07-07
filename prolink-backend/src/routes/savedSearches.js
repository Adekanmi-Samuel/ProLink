const express = require('express');
const router = express.Router();
const savedSearchesController = require('../controllers/savedSearchesController');
const authMiddleware = require('../middleware/authMiddleware');
const { apiLimiter } = require('../middleware/rateLimiter');

router.use(authMiddleware);
router.use(apiLimiter);

router.post('/', savedSearchesController.createSavedSearch);
router.get('/', savedSearchesController.getSavedSearches);
router.delete('/:id', savedSearchesController.deleteSavedSearch);

module.exports = router;
