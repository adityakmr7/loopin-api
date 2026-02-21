-- AlterTable
ALTER TABLE "automation_rules" ADD COLUMN     "dmCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "instagram_comments" ADD COLUMN     "dmError" TEXT,
ADD COLUMN     "dmSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "dmSentAt" TIMESTAMP(3),
ADD COLUMN     "dmText" TEXT;
