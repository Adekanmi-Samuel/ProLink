require('dotenv').config();
const { Pool } = require('pg');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

console.log('DATABASE_URL present:', !!process.env.DATABASE_URL);
console.log('DIRECT_URL present:', !!process.env.DIRECT_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 3,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function test() {
  try {
    const user = await prisma.user.findFirst({ take: 1, select: { id: true, email: true } });
    console.log('USERS OK:', JSON.stringify(user));
  } catch(e) {
    console.log('ERROR:', e.message);
  }

  try {
    const cat = await prisma.category.findFirst({ select: { id: true, name: true } });
    console.log('CATEGORIES OK:', JSON.stringify(cat));
  } catch(e) {
    console.log('CAT ERROR:', e.message);
  }

  await prisma.$disconnect();
  await pool.end();
}
test();
