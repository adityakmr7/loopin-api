-- AlterTable
ALTER TABLE "automation_rules" ADD COLUMN     "likeCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "replyCount" INTEGER NOT NULL DEFAULT 0;
