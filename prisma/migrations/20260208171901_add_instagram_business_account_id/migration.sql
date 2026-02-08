/*
  Warnings:

  - A unique constraint covering the columns `[instagramBusinessAccountId]` on the table `instagram_accounts` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "instagram_accounts" ADD COLUMN     "instagramBusinessAccountId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "instagram_accounts_instagramBusinessAccountId_key" ON "instagram_accounts"("instagramBusinessAccountId");

-- CreateIndex
CREATE INDEX "instagram_accounts_instagramBusinessAccountId_idx" ON "instagram_accounts"("instagramBusinessAccountId");
