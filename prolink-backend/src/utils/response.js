/**
 * Standardized API response helpers.
 * Use these in all controllers to ensure consistent response shapes.
 */
const error = (res, status, message) => res.status(status).json({ error: message });
const success = (res, data, status = 200) => res.status(status).json(data);

module.exports = { error, success };
