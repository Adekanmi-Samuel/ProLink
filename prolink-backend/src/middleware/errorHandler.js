/**
 * Global error handling middleware
 * Must be placed last in middleware stack.
 * Never leaks internal error details to API clients.
 */
const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
  logger.error('Request error', {
    error: err.message,
    stack: err.stack,
    code: err.code,
    method: req.method,
    path: req.originalUrl,
    userId: req.user?.id,
    ip: req.ip,
  });

  // Prisma validation errors
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Record not found' });
  }

  // Prisma unique constraint errors
  if (err.code === 'P2002') {
    const field = err.meta?.target?.[0] || 'field';
    return res.status(409).json({ error: `${field} already exists` });
  }

  // Prisma foreign key errors
  if (err.code === 'P2003') {
    return res.status(400).json({ error: 'Invalid reference to related record' });
  }

  // Custom application errors
  if (err.statusCode) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  // Default server error
  res.status(500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
  });
};

module.exports = errorHandler;
