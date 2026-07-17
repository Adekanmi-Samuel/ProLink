const express = require('express');
const router = express.Router();
const taxonomyController = require('../controllers/taxonomyController');
const { searchLimiter } = require('../middleware/rateLimiter');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/categories', searchLimiter, taxonomyController.getCategories);
router.get('/skills', searchLimiter, taxonomyController.getSkills);
router.post('/skills', searchLimiter, authMiddleware, taxonomyController.createSkill);

module.exports = router;
