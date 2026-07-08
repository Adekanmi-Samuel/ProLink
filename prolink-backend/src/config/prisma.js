require('dotenv').config();
const { Pool } = require('pg');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { parse } = require('pg-connection-string');
const logger = require('./logger');

// Parse the connection string to explicitly pass the string components to bypass pg SCRAM bugs
const config = parse(process.env.DATABASE_URL);
const poolConfig = {
  user: config.user,
  password: String(config.password),
  host: config.host,
  port: config.port,
  database: config.database,
  ssl: { rejectUnauthorized: false },
  max: parseInt(process.env.DB_POOL_MAX || (process.env.VERCEL ? '1' : '10'), 10),
  min: parseInt(process.env.DB_POOL_MIN || (process.env.VERCEL ? '0' : '2'), 10),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000', 10),
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
};

const pool = new Pool(poolConfig);

// Log and recover from idle client connection errors
pool.on('error', (err) => {
  logger.error('Unexpected error on idle pg client', { error: err.message });
});

const adapter = new PrismaPg(pool);
const prismaConfig = { adapter };

// Enable query logging in development
if (process.env.NODE_ENV !== 'production') {
  prismaConfig.log = [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'stdout' },
    { level: 'warn', emit: 'stdout' },
  ];
}

const prisma = new PrismaClient(prismaConfig);

// Log queries in development
if (process.env.NODE_ENV !== 'production') {
  prisma.$on('query', (e) => {
    logger.debug('Prisma query', {
      query: e.query,
      params: e.params,
      duration: `${e.duration}ms`,
    });
  });
}

// Graceful shutdown handling
process.on('beforeExit', async () => {
  await prisma.$disconnect();
  await pool.end();
});

module.exports = prisma;
