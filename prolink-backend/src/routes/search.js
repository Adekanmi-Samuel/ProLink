const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const { searchLimiter } = require('../middleware/rateLimiter');

router.get('/jobs', searchLimiter, searchController.searchJobs);
router.get('/providers', searchLimiter, searchController.searchProviders);

module.exports = router;
