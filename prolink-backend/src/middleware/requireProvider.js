const requireProvider = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (req.user.user_type !== 'provider') {
    return res.status(403).json({ error: 'Provider access required' });
  }
  next();
};
module.exports = requireProvider;
