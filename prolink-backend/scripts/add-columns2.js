const prisma = require('../src/config/prisma');

async function main() {
  await prisma.$executeRawUnsafe('ALTER TABLE "Milestone" ADD COLUMN IF NOT EXISTS "submitted_at" TIMESTAMP(3);');
  await prisma.$executeRawUnsafe('ALTER TABLE "Milestone" ADD COLUMN IF NOT EXISTS "revision_notes" TEXT;');
  console.log('Columns added successfully');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
