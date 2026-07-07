const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

module.exports = async function(req, res, next) {
  let actualToken = null;
  
  const authHeader = req.header('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    actualToken = authHeader.split(' ')[1];
  }

  if (!actualToken && req.headers.cookie) {
    const cookies = req.headers.cookie.split(';');
    for (let cookie of cookies) {
      const [name, val] = cookie.trim().split('=');
      if (name === 'token') {
        actualToken = val;
        break;
      }
    }
  }

  if (!actualToken) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(actualToken, process.env.JWT_SECRET);
    
    // Check token version to ensure session hasn't been revoked
    if (decoded.user && decoded.user.token_version !== undefined) {
      const user = await prisma.user.findUnique({
        where: { id: decoded.user.id },
        select: { token_version: true }
      });
      if (!user || user.token_version !== decoded.user.token_version) {
        return res.status(401).json({ msg: 'Session expired. Please log in again.' });
      }
    }

    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
