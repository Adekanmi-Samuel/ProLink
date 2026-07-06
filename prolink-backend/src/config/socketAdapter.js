const logger = require('./logger');

/**
 * Attach a Redis adapter to Socket.IO for horizontal scaling.
 * 
 * When running multiple server instances (e.g. behind a load balancer),
 * Socket.IO events need to be broadcast across all instances.
 * The Redis adapter handles this by using Redis pub/sub.
 * 
 * Usage: Set the REDIS_URL environment variable and call this on startup.
 * 
 * Example:
 *   REDIS_URL=redis://localhost:6379
 * 
 * For Render/Railway: Use the managed Redis add-on URL.
 * For Supabase: Not applicable — use a separate Redis provider (Upstash, etc.)
 */
const attachRedisAdapter = async (io) => {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    logger.info('No REDIS_URL set — Socket.IO running in single-instance mode');
    return;
  }

  try {
    // Dynamic import so Redis deps are optional
    const { createAdapter } = require('@socket.io/redis-adapter');
    const { createClient } = require('redis');

    const pubClient = createClient({ url: redisUrl });
    const subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);

    io.adapter(createAdapter(pubClient, subClient));
    logger.info('Socket.IO Redis adapter attached for horizontal scaling');
  } catch (err) {
    logger.warn('Failed to attach Redis adapter — falling back to single-instance', {
      error: err.message,
    });
  }
};

module.exports = { attachRedisAdapter };
