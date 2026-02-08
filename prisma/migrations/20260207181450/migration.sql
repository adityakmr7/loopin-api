/*
  Warnings:

  - You are about to drop the `instagram_messages` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "instagram_messages" DROP CONSTRAINT "instagram_messages_accountId_fkey";

-- DropTable
DROP TABLE "instagram_messages";

-- CreateTable
CREATE TABLE "instagram_account_snapshots" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "followersCount" INTEGER NOT NULL,
    "followingCount" INTEGER NOT NULL,
    "mediaCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "instagram_account_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "instagram_account_snapshots_accountId_idx" ON "instagram_account_snapshots"("accountId");

-- CreateIndex
CREATE INDEX "instagram_account_snapshots_accountId_createdAt_idx" ON "instagram_account_snapshots"("accountId", "createdAt");

-- AddForeignKey
ALTER TABLE "instagram_account_snapshots" ADD CONSTRAINT "instagram_account_snapshots_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "instagram_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
