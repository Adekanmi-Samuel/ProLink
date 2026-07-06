import 'dotenv/config';
import path from 'node:path';
import { defineConfig } from 'prisma/config';
import { PrismaPg } from '@prisma/adapter-pg';

// Use DIRECT_URL for migrations (direct connection to avoid pgbouncer)
// Fall back to DATABASE_URL if DIRECT_URL is not available (e.g., during Render build)
const directUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

export default defineConfig({
  earlyAccess: true,
  schema: path.join('prisma', 'schema.prisma'),

  datasource: {
    url: directUrl,
  },

  migrate: {
    async adapter() {
      return new PrismaPg({ connectionString: directUrl });
    },
  },
});