const morgan = require('morgan');
const logger = require('../config/logger');

// Stream that pipes Morgan output into Winston at the 'http' level
const stream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

// Skip health check endpoints to avoid log noise
const skip = (req) => {
  return req.url === '/health' || req.url === '/' || req.url === '/health-db';
};

const httpLogger = morgan(
  ':remote-addr :method :url :status :res[content-length] - :response-time ms',
  { stream, skip }
);

module.exports = httpLogger;
