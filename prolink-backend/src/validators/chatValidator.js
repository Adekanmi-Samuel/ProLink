const { z } = require('zod');

// Chat thread initiation validation
const initiateChatsSchema = z.object({
  jobId: z.number().int().positive('Job ID must be a positive number'),
  providerId: z.number().int().positive('Provider ID must be a positive number'),
});

// Send message validation
const sendMessageSchema = z.object({
  thread_id: z.number().int().positive('Thread ID must be a positive number'),
  content: z.string().min(1, 'Message cannot be empty').max(5000, 'Message is too long'),
  message_type: z.enum(['text', 'image', 'video', 'document']).default('text'),
});

// Pagination query validation
const paginationSchema = z.object({
  limit: z.number().int().positive().max(100).default(50),
  cursor: z.number().int().nonnegative().optional(),
});

module.exports = {
  initiateChatsSchema,
  sendMessageSchema,
  paginationSchema,
};
