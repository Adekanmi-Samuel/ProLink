import { defineConfig } from '@prisma/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { parse } from 'pg-connection-string';
import { config as loadEnv } from 'dotenv';

loadEnv();

const dbUrl = process.env.DATABASE_URL || '';
const parsedConfig = parse(dbUrl);
const poolConfig = {
  user: parsedConfig.user,
  password: parsedConfig.password ? String(parsedConfig.password) : undefined,
  host: parsedConfig.host,
  port: parsedConfig.port ? parseInt(String(parsedConfig.port), 10) : 6543,
  database: parsedConfig.database,
  ssl: { rejectUnauthorized: false }
};

const pool = new Pool(poolConfig);
const adapter = new PrismaPg(pool);

export default defineConfig({
  earlyAccess: true,
  adapter,
  datasource: {
    url: dbUrl
  }
});
