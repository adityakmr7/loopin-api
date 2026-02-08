-- CreateTable
CREATE TABLE "instagram_messages" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "senderUsername" TEXT,
    "text" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "instagram_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "instagram_messages_messageId_key" ON "instagram_messages"("messageId");

-- CreateIndex
CREATE INDEX "instagram_messages_accountId_idx" ON "instagram_messages"("accountId");

-- CreateIndex
CREATE INDEX "instagram_messages_senderId_idx" ON "instagram_messages"("senderId");

-- CreateIndex
CREATE INDEX "instagram_messages_createdAt_idx" ON "instagram_messages"("createdAt");

-- AddForeignKey
ALTER TABLE "instagram_messages" ADD CONSTRAINT "instagram_messages_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "instagram_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
