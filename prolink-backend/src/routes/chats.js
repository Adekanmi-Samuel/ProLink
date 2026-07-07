const express = require('express');
const chatsController = require('../controllers/chatsController');
const authMiddleware = require('../middleware/authMiddleware');
const { validateRequest, asyncHandler } = require('../middleware/validationMiddleware');
const { initiateChatsSchema, sendMessageSchema, paginationSchema } = require('../validators/chatValidator');
const { apiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Initiate a new chat thread
router.post(
  '/initiate',
  authMiddleware,
  apiLimiter,
  validateRequest(initiateChatsSchema, 'body'),
  asyncHandler(chatsController.initiateChat)
);

// Get messages in a thread (with pagination)
router.get(
  '/:threadId/messages',
  authMiddleware,
  apiLimiter,
  validateRequest(paginationSchema, 'query'),
  asyncHandler(chatsController.getThreadMessages)
);

// Send a message in a thread
router.post(
  '/:threadId/messages',
  authMiddleware,
  apiLimiter,
  validateRequest(sendMessageSchema, 'body'),
  asyncHandler(chatsController.sendMessage)
);

// Get thread details
router.get(
  '/:threadId/details',
  authMiddleware,
  apiLimiter,
  asyncHandler(chatsController.getThreadDetails)
);

// Get all threads for the user
router.get(
  '/',
  authMiddleware,
  apiLimiter,
  asyncHandler(chatsController.getUserThreads)
);

module.exports = router;
