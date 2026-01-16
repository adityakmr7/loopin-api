-- CreateTable
CREATE TABLE "webhook_events" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "instagramUserId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instagram_comments" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "isReply" BOOLEAN NOT NULL DEFAULT false,
    "parentId" TEXT,
    "replied" BOOLEAN NOT NULL DEFAULT false,
    "replyText" TEXT,
    "repliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "instagram_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "webhook_events_accountId_idx" ON "webhook_events"("accountId");

-- CreateIndex
CREATE INDEX "webhook_events_eventType_idx" ON "webhook_events"("eventType");

-- CreateIndex
CREATE INDEX "webhook_events_processed_idx" ON "webhook_events"("processed");

-- CreateIndex
CREATE INDEX "webhook_events_createdAt_idx" ON "webhook_events"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "instagram_comments_commentId_key" ON "instagram_comments"("commentId");

-- CreateIndex
CREATE INDEX "instagram_comments_accountId_idx" ON "instagram_comments"("accountId");

-- CreateIndex
CREATE INDEX "instagram_comments_mediaId_idx" ON "instagram_comments"("mediaId");

-- CreateIndex
CREATE INDEX "instagram_comments_commentId_idx" ON "instagram_comments"("commentId");

-- AddForeignKey
ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "instagram_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instagram_comments" ADD CONSTRAINT "instagram_comments_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "instagram_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
