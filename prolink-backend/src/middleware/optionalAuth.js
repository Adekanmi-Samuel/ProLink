const jwt = require('jsonwebtoken');

const optionalAuth = (req, res, next) => {
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

  if (actualToken) {
    try {
      const decoded = jwt.verify(actualToken, process.env.JWT_SECRET);
      req.user = decoded.user;
    } catch (err) {
      // invalid token, but optional so proceed
      req.user = null;
    }
  } else {
    req.user = null;
  }

  next();
};

module.exports = optionalAuth;
