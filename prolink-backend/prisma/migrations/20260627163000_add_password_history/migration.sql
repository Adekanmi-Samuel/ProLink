-- AlterTable
ALTER TABLE "User" ADD COLUMN "previous_passwords" JSONB DEFAULT '[]';
