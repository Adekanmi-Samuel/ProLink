const { PrismaClient } = require('@prisma/client');

// Ensure env is loaded (DATABASE_URL should come from .env / process env)
require('dotenv').config();

console.log('DATABASE_URL present?', Boolean(process.env.DATABASE_URL));
console.log('DATABASE_URL length:', process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 0);

const prisma = new PrismaClient();




async function main() {
  await prisma.$connect();
  console.log("Connected successfully!");
  const users = await prisma.user.findMany({ take: 1 });
  console.log("Users:", users);
}

main().catch(e => {
  console.error(e);
}).finally(async () => {
  await prisma.$disconnect();
});
