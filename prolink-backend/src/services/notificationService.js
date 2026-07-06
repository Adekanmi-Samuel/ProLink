const prisma = require('../config/prisma');
const { getIo } = require('../socket');

const createNotification = async (userId, type, content, linkUrl = null) => {
  const notification = await prisma.notification.create({
    data: { user_id: userId, type, content, link_url: linkUrl }
  });
  const io = getIo();
  if (io) io.to(`user_${userId}`).emit('notification', notification);
  return notification;
};

const getNotifications = async (userId) => {
  return await prisma.notification.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'desc' }
  });
};

const getUnreadCount = async (userId) => {
  return await prisma.notification.count({
    where: { user_id: userId, is_read: false }
  });
};

const markAsRead = async (notificationId, userId) => {
  return await prisma.notification.update({
    where: { id: notificationId, user_id: userId },
    data: { is_read: true }
  });
};

const markAllAsRead = async (userId) => {
  return await prisma.notification.updateMany({
    where: { user_id: userId, is_read: false },
    data: { is_read: true }
  });
};

module.exports = { createNotification, getNotifications, getUnreadCount, markAsRead, markAllAsRead };
