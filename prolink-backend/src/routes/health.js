/**
 * Health Check Routes
 *
 * Provides endpoints for load balancer health checks
 * and detailed system readiness probes.
 */
const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const cacheService = require('../cache/CacheService');
const eventBus = require('../events/EventBus');
const { circuitBreakerRegistry } = require('../resilience/CircuitBreaker');
const logger = require('../config/logger');

/**
 * GET /health/liveness
 * Basic liveness check for load balancer (simple and fast)
 */
router.get('/liveness', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * GET /health/readiness
 * Readiness probe — checks if the app can serve traffic
 * Verifies database connectivity and critical services
 */
router.get('/readiness', async (req, res) => {
  const checks = {
    database: false,
    cache: false,
    eventBus: false,
  };
  let healthy = true;

  // Check database
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch (err) {
    healthy = false;
    logger.error('[Health] Database check failed:', err);
  }

  // Check cache
  try {
    checks.cache = cacheService.getMetrics().size >= 0;
  } catch (err) {
    healthy = false;
    logger.error('[Health] Cache check failed:', err);
  }

  // Check event bus
  try {
    checks.eventBus = typeof eventBus.emit === 'function';
  } catch (err) {
    healthy = false;
    logger.error('[Health] EventBus check failed:', err);
  }

  const statusCode = healthy ? 200 : 503;
  res.status(statusCode).json({
    status: healthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    checks,
  });
});

/**
 * GET /health/metrics
 * Detailed system metrics for monitoring
 */
router.get('/metrics', (req, res) => {
  const memory = process.memoryUsage();
  const uptime = process.uptime();

  res.json({
    uptime: Math.floor(uptime),
    uptimeHuman: `${Math.floor(uptime / 86400)}d ${Math.floor((uptime % 86400) / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
    memory: {
      rss: `${(memory.rss / 1024 / 1024).toFixed(2)} MB`,
      heapTotal: `${(memory.heapTotal / 1024 / 1024).toFixed(2)} MB`,
      heapUsed: `${(memory.heapUsed / 1024 / 1024).toFixed(2)} MB`,
    },
    cache: cacheService.getMetrics(),
    circuitBreakers: circuitBreakerRegistry.getAllStates(),
    eventBus: eventBus.getMetrics(),
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development',
  });
});

module.exports = router;
