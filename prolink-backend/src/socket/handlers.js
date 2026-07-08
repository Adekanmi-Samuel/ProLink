/**
 * Socket.IO Event Handlers for Real-Time Chat
 * Handles WebSocket connections, messaging, and typing indicators
 */

const prisma = require('../config/prisma');
const Filter = require('bad-words');
const { createNotification } = require('../services/notificationService');

const filter = new Filter();

/**
 * Initialize Socket.IO event listeners
 * @param {Server} io - Socket.IO server instance
 */
const initializeSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id} (userId: ${socket.userId})`);

    // =====================
    // GLOBAL USER ROOM
    // =====================
    // Join a personal room to receive global real-time updates (jobs, notifications)
    socket.join(`user_${socket.userId}`);
    socket.join(`global_updates`); // A room for platform-wide updates like new jobs

    // =====================
    // JOIN THREAD EVENT
    // =====================
    socket.on('join_thread', async (data) => {
      try {
        const { threadId } = data;

        if (!threadId) {
          return socket.emit('error', { message: 'Thread ID is required' });
        }

        // Verify the user is a participant in this thread
        const thread = await prisma.chatThread.findUnique({
          where: { id: parseInt(threadId) },
          select: { client_id: true, provider_id: true },
        });

        if (!thread) {
          return socket.emit('error', { message: 'Thread not found' });
        }

        if (thread.client_id !== socket.userId && thread.provider_id !== socket.userId) {
          return socket.emit('error', { message: 'Not authorized to join this thread' });
        }

        // Add user to the room
        const roomName = `thread_${threadId}`;
        socket.join(roomName);

        // Notify others in the room
        io.to(roomName).emit('user_joined', {
          userId: socket.userId,
          timestamp: new Date(),
        });

        socket.emit('joined_thread', {
          status: 'success',
          threadId,
        });

        console.log(`User ${socket.userId} joined thread ${threadId}`);
      } catch (err) {
        console.error('join_thread error:', err);
        socket.emit('error', { message: 'Failed to join thread' });
      }
    });

    // =====================
    // SEND MESSAGE EVENT
    // =====================
    socket.on('send_message', async (data) => {
      try {
        const { threadId, content, message_type = 'text' } = data;

        if (!threadId || !content?.trim()) {
          return socket.emit('error', { message: 'Thread ID and content are required' });
        }

        // Verify authorization
        const thread = await prisma.chatThread.findUnique({
          where: { id: parseInt(threadId) },
          select: { client_id: true, provider_id: true, job_id: true },
        });

        if (!thread) {
          return socket.emit('error', { message: 'Thread not found' });
        }

        if (thread.client_id !== socket.userId && thread.provider_id !== socket.userId) {
          return socket.emit('error', { message: 'Not authorized to message in this thread' });
        }

        // Check blocks
        const otherUserId = thread.client_id === socket.userId ? thread.provider_id : thread.client_id;
        const block = await prisma.block.findFirst({
          where: {
            OR: [
              { blocker_id: socket.userId, blocked_id: otherUserId },
              { blocker_id: otherUserId, blocked_id: socket.userId }
            ]
          }
        });

        if (block) {
          return socket.emit('error', { message: 'You cannot message this user.' });
        }

        let cleanContent = content.trim();

        // Only apply bad-words and anti-disintermediation masking if it's a text message
        if (message_type === 'text') {
          cleanContent = filter.clean(cleanContent);

          // Anti-Disintermediation: Mask contact info if no JobAssignment exists
          const assignment = await prisma.jobAssignment.findFirst({
            where: { job_id: thread.job_id, provider_id: thread.provider_id }
          });

          if (!assignment) {
            // Mask Emails
            cleanContent = cleanContent.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL HIDDEN]');
            // Mask Phone Numbers
            cleanContent = cleanContent.replace(/(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{2,4}\)?[\s-]?)?\d{3,4}[\s-]?\d{3,4}/g, '[PHONE HIDDEN]');
            // Mask URLs
            cleanContent = cleanContent.replace(/(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi, '[LINK HIDDEN]');
          }
        }

        // Save message to database FIRST
        const message = await prisma.message.create({
          data: {
            thread_id: parseInt(threadId),
            sender_id: socket.userId,
            content: cleanContent,
            message_type: message_type,
          },
          select: {
            id: true,
            thread_id: true,
            sender_id: true,
            content: true,
            message_type: true,
            sent_at: true,
          },
        });

        // Broadcast the message to all users in the thread
        const roomName = `thread_${threadId}`;
        io.to(roomName).emit('new_message', {
          ...message,
          _persisted: true, // Flag to indicate this was saved to DB
        });

        console.log(`Message saved and broadcasted in thread ${threadId}`);

        // Send Email Notification to the recipient
        const emailService = require('../services/emailService');
        try {
          const [recipientUser, senderProfile] = await Promise.all([
            prisma.user.findUnique({ where: { id: otherUserId }, select: { email: true } }),
            prisma.profile.findUnique({ where: { user_id: socket.userId }, select: { full_name: true } })
          ]);

          if (recipientUser && senderProfile) {
            let notificationText = cleanContent;
            
            if (message_type === 'image' || message_type === 'document' || message_type === 'video') {
              try {
                const parsed = JSON.parse(cleanContent);
                notificationText = parsed.caption 
                  ? `[Attachment]: ${parsed.caption}` 
                  : `[Sent an attachment]`;
              } catch (e) {
                notificationText = `[Sent an attachment]`;
              }
            }

            emailService.sendChatMessageNotification(
              recipientUser.email,
              senderProfile.full_name || 'A ProLink user',
              notificationText,
              threadId
            ).catch(err => console.error('Failed to send chat email:', err));

            // Real-time notification for the other user
            createNotification(otherUserId, 'new_message', `${senderProfile.full_name || 'A user'} sent a message`, `/chat/${threadId}`).catch(console.error);
          }
        } catch (emailErr) {
          console.error('Error fetching data for chat email:', emailErr);
        }
      } catch (err) {
        console.error('send_message error:', err);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // =====================
    // TYPING INDICATOR EVENT
    // =====================
    socket.on('typing_indicator', async (data) => {
      try {
        const { threadId, isTyping } = data;

        if (!threadId) {
          return socket.emit('error', { message: 'Thread ID is required' });
        }

        const roomName = `thread_${threadId}`;

        if (isTyping) {
          io.to(roomName).emit('user_typing', {
            userId: socket.userId,
            threadId,
          });
        } else {
          io.to(roomName).emit('user_stopped_typing', {
            userId: socket.userId,
            threadId,
          });
        }
      } catch (err) {
        console.error('typing_indicator error:', err);
        socket.emit('error', { message: 'Failed to send typing indicator' });
      }
    });

    // =====================
    // MARK READ EVENT
    // =====================
    socket.on('mark_read', async (data) => {
      try {
        const { threadId } = data;
        if (!threadId) return;

        const now = new Date();

        // Mark unread messages sent BY the other person as read
        await prisma.message.updateMany({
          where: {
            thread_id: parseInt(threadId),
            sender_id: { not: socket.userId },
            read_at: null,
          },
          data: { read_at: now },
        });

        // Broadcast back to the room that messages were read
        const roomName = `thread_${threadId}`;
        io.to(roomName).emit('messages_read', {
          threadId: parseInt(threadId),
          readByUserId: socket.userId,
          readAt: now,
        });
      } catch (err) {
        console.error('mark_read error:', err);
      }
    });

    // =====================
    // DISCONNECTING EVENT
    // =====================
    socket.on('disconnecting', () => {
      console.log(`User disconnecting: ${socket.id} (userId: ${socket.userId})`);

      // Broadcast user offline to all rooms they were in
      socket.rooms.forEach((room) => {
        if (room.startsWith('thread_')) {
          io.to(room).emit('user_left', {
            userId: socket.userId,
            timestamp: new Date(),
          });
        }
      });
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });

    // =====================
    // ERROR HANDLING
    // =====================
    socket.on('error', (err) => {
      console.error(`Socket error for user ${socket.userId}:`, err);
    });
  });
};

module.exports = { initializeSocketHandlers };
