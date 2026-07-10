const prisma = require('../config/prisma');
const logger = require('../config/logger');

const requireAdmin = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || user.user_type !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  } catch (error) {
    logger.error('Admin middleware error', { error: error.message });
    res.status(500).json({ error: 'Server error verifying admin status' });
  }
};

module.exports = requireAdmin;
