const { z } = require('zod');

// Chat thread initiation validation
const initiateChatsSchema = z.object({
  jobId: z.number().int().positive('Job ID must be a positive number'),
  providerId: z.number().int().positive('Provider ID must be a positive number'),
});

// Send message validation
const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(5000, 'Message is too long'),
  message_type: z.enum(['text', 'image', 'video', 'document']).default('text'),
});

// Pagination query validation
const paginationSchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(50),
  cursor: z.coerce.number().int().nonnegative().optional(),
});

module.exports = {
  initiateChatsSchema,
  sendMessageSchema,
  paginationSchema,
};
