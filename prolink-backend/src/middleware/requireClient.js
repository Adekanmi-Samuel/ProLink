const prisma = require('../config/prisma');

const requireClient = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.user_type !== 'client') {
      return res.status(403).json({ msg: 'Only clients can perform this action' });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: 'Server error verifying role' });
  }
};

module.exports = requireClient;
