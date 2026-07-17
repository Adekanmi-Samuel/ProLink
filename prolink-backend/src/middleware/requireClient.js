const requireClient = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (req.user.user_type !== 'client') {
    return res.status(403).json({ error: 'Client access required' });
  }
  next();
};
module.exports = requireClient;
