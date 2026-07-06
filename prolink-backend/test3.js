require('dotenv').config();
const prisma = require('./src/config/prisma');

async function main() {
  console.log('Connecting...');
  const users = await prisma.user.findMany({take: 1});
  console.log('Users:', users);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
