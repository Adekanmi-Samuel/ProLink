const notificationService = require('../services/notificationService');

const getNotifications = async (req, res) => {
  try {
    const notifications = await notificationService.getNotifications(req.user.id);
    const unreadCount = await notificationService.getUnreadCount(req.user.id);
    res.json({ notifications, unreadCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    await notificationService.markAsRead(id, req.user.id);
    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const count = await notificationService.getUnreadCount(req.user.id);
    res.json({ unreadCount: count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const count = await notificationService.markAllAsRead(req.user.id);
    res.json({ message: 'All notifications marked as read', count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getNotifications, getUnreadCount, markAsRead, markAllAsRead };
