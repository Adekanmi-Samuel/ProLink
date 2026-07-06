const prisma = require('../config/prisma');

const initiateChat = async (clientId, { jobId, providerId }) => {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: { client_id: true },
  });
  if (!job) throw new Error('Job not found.');
  if (job.client_id !== clientId) throw new Error('You are not authorized to initiate this chat.');

  let thread = await prisma.chatThread.findFirst({
    where: { job_id: jobId, client_id: clientId, provider_id: providerId },
  });
  if (!thread) {
    thread = await prisma.chatThread.create({
      data: { job_id: jobId, client_id: clientId, provider_id: providerId },
    });
  }
  return thread.id;
};

/**
 * Fetch messages with cursor-based pagination
 * @param {number} threadId - Chat thread ID
 * @param {number} userId - User ID for authorization
 * @param {object} pagination - { limit: number, cursor?: number }
 * @returns {object} { messages: [], nextCursor: number | null }
 */
const getThreadMessages = async (threadId, userId, pagination = {}) => {
  const { limit = 50, cursor } = pagination;

  // Authorization check
  const thread = await prisma.chatThread.findUnique({ where: { id: threadId }, select: { id: true, client_id: true, provider_id: true } });
  if (!thread) throw new Error('Thread not found.');
  if (thread.client_id !== userId && thread.provider_id !== userId) {
    throw new Error('Not authorized to view this conversation.');
  }

  // Mark unread messages from the other user as read
  await prisma.message.updateMany({
    where: {
      thread_id: threadId,
      sender_id: { not: userId },
      read_at: null,
    },
    data: { read_at: new Date() },
  });

  // Fetch one extra to determine if there are more messages
  const messages = await prisma.message.findMany({
    where: { thread_id: threadId, ...(cursor && { id: { lt: cursor } }) },
    orderBy: { id: 'desc' },
    take: limit + 1,
    select: {
      id: true,
      thread_id: true,
      sender_id: true,
      content: true,
      message_type: true,
      sent_at: true,
      read_at: true,
    },
  });

  const hasMore = messages.length > limit;
  const paginatedMessages = hasMore ? messages.slice(0, limit) : messages;
  const nextCursor = hasMore ? paginatedMessages[paginatedMessages.length - 1]?.id : null;

  // Reverse to maintain chronological order
  return {
    messages: paginatedMessages.reverse().map(msg => ({
      id: msg.id,
      thread_id: msg.thread_id,
      sender_id: msg.sender_id,
      content: msg.content,
      message_type: msg.message_type,
      sent_at: msg.sent_at,
      read_at: msg.read_at,
    })),
    nextCursor,
    hasMore,
  };
};

const getThreadDetails = async (threadId, userId) => {
  const thread = await prisma.chatThread.findUnique({
    where: { id: threadId },
    include: {
      job: { select: { title: true } },
      client: { include: { profile: { select: { full_name: true, profile_picture_url: true } } } },
      provider: { include: { profile: { select: { full_name: true, profile_picture_url: true } } } },
    },
  });
  if (!thread) throw new Error('Thread not found.');
  if (thread.client_id !== userId && thread.provider_id !== userId) {
    throw new Error('Not authorized to view this conversation.');
  }

  const isClient = thread.client_id === userId;
  const otherParty = isClient ? thread.provider : thread.client;

  return {
    thread_id: thread.id,
    job_title: thread.job.title,
    other_user_id: isClient ? thread.provider_id : thread.client_id,
    other_user_name: otherParty?.profile?.full_name || 'ProLink User',
    other_user_avatar: otherParty?.profile?.profile_picture_url || null,
  };
};

const getUserThreads = async (userId) => {
  const threads = await prisma.chatThread.findMany({
    where: { OR: [{ client_id: userId }, { provider_id: userId }] },
    include: {
      job: { select: { title: true } },
      client: { include: { profile: { select: { full_name: true, profile_picture_url: true } } } },
      provider: { include: { profile: { select: { full_name: true, profile_picture_url: true } } } },
      messages: {
        orderBy: { sent_at: 'desc' },
        take: 1,
      },
      _count: {
        select: {
          messages: {
            where: {
              sender_id: { not: userId },
              read_at: null,
            },
          },
        },
      },
    },
    orderBy: { created_at: 'desc' },
  });

  return threads.map((t) => {
    const isClient = t.client_id === userId;
    const otherParty = isClient ? t.provider : t.client;
    const lastMessage = t.messages[0] || null;
    
    let displayMessage = lastMessage?.content || null;
    if (lastMessage && (lastMessage.message_type === 'image' || lastMessage.message_type === 'document' || lastMessage.message_type === 'video')) {
      try {
        const parsed = JSON.parse(lastMessage.content);
        displayMessage = parsed.caption ? `📎 Attachment: ${parsed.caption}` : `📎 Attachment`;
      } catch (e) {
        displayMessage = `📎 Attachment`;
      }
    }

    return {
      thread_id: t.id,
      job_title: t.job.title,
      other_user_id: isClient ? t.provider_id : t.client_id,
      other_user_name: otherParty?.profile?.full_name || 'ProLink User',
      other_user_avatar: otherParty?.profile?.profile_picture_url || null,
      last_message: displayMessage,
      last_message_at: lastMessage?.sent_at || t.created_at,
      unread_count: t._count?.messages || 0,
    };
  });
};

/**
 * Send a message in a thread
 * @param {number} threadId - Chat thread ID
 * @param {number} senderId - User ID of the message sender
 * @param {object} messageData - { content: string, message_type?: string }
 * @returns {object} Created message
 */
const sendMessage = async (threadId, senderId, messageData) => {
  const thread = await prisma.chatThread.findUnique({
    where: { id: threadId },
    select: { client_id: true, provider_id: true },
  });

  if (!thread) throw new Error('Thread not found.');
  if (thread.client_id !== senderId && thread.provider_id !== senderId) {
    throw new Error('Not authorized to send messages in this thread.');
  }

  const otherUserId = thread.client_id === senderId ? thread.provider_id : thread.client_id;

  const block = await prisma.block.findFirst({
    where: {
      OR: [
        { blocker_id: senderId, blocked_id: otherUserId },
        { blocker_id: otherUserId, blocked_id: senderId },
      ],
    },
  });

  if (block) throw new Error('You cannot message this user.');

  const message = await prisma.message.create({
    data: {
      thread_id: threadId,
      sender_id: senderId,
      content: messageData.content,
      message_type: messageData.message_type || 'text',
    },
    select: {
      id: true,
      thread_id: true,
      sender_id: true,
      content: true,
      message_type: true,
      sent_at: true,
      read_at: true,
    },
  });

  // Send ntfy push to the other user
  try {
    const topic = `prolink_user_${otherUserId}`;
    if (typeof fetch !== 'undefined') {
      await fetch(`https://ntfy.sh/${topic}`, {
        method: 'POST',
        body: messageData.message_type === 'text' ? messageData.content : '📎 Attachment',
        headers: {
          'Title': 'New Message on ProLink',
          'Tags': 'speech_balloon'
        }
      });
    }
  } catch (err) {
    console.error('Failed to send ntfy push notification for message:', err);
  }

  return message;
};

module.exports = { initiateChat, getThreadMessages, getThreadDetails, getUserThreads, sendMessage };
