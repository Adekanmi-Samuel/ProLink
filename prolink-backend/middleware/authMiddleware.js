const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
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
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};