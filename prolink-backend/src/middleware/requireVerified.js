const prisma = require('../config/prisma');
const logger = require('../config/logger');

const requireVerified = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (user.status === 'banned' || user.status === 'suspended') {
      return res.status(403).json({ error: 'Your account has been ' + user.status });
    }

    if (!user.email_verified) {
      return res.status(403).json({ msg: 'Please verify your email address before posting a job' });
    }

    next();
  } catch (error) {
    logger.error('Verify middleware error', { error: error.message });
    res.status(500).json({ error: 'Server error verifying account status' });
  }
};

module.exports = requireVerified;
