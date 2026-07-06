const chatsService = require('../services/chatsService');

/**
 * Initiate a new chat thread between a client and provider
 */
const initiateChat = async (req, res, next) => {
  try {
    const { jobId, providerId } = req.validatedBody;

    const threadId = await chatsService.initiateChat(req.user.id, {
      jobId,
      providerId,
    });

    res.status(201).json({
      status: 'success',
      threadId,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get messages in a thread with cursor-based pagination
 */
const getThreadMessages = async (req, res, next) => {
  try {
    const threadId = parseInt(req.params.threadId);
    const { limit, cursor } = req.validatedQuery;

    const result = await chatsService.getThreadMessages(threadId, req.user.id, {
      limit,
      cursor,
    });

    res.json({
      status: 'success',
      data: result.messages,
      pagination: {
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
        limit,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get thread details (participants, job info, etc.)
 */
const getThreadDetails = async (req, res, next) => {
  try {
    const threadId = parseInt(req.params.threadId);
    const details = await chatsService.getThreadDetails(threadId, req.user.id);

    res.json({
      status: 'success',
      data: details,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get all chat threads for the authenticated user
 */
const getUserThreads = async (req, res, next) => {
  try {
    const threads = await chatsService.getUserThreads(req.user.id);

    res.json({
      status: 'success',
      data: threads,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Send a message in a thread
 */
const sendMessage = async (req, res, next) => {
  try {
    const threadId = parseInt(req.params.threadId);
    const { content, message_type } = req.validatedBody;

    const message = await chatsService.sendMessage(threadId, req.user.id, {
      content,
      message_type,
    });

    res.status(201).json({
      status: 'success',
      data: message,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { 
  initiateChat, 
  getThreadMessages, 
  getThreadDetails, 
  getUserThreads,
  sendMessage,
};
