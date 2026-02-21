-- CreateTable
CREATE TABLE "user_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "maxRepliesPerHour" INTEGER NOT NULL DEFAULT 30,
    "replyDelayMinSecs" INTEGER NOT NULL DEFAULT 5,
    "replyDelayMaxSecs" INTEGER NOT NULL DEFAULT 30,
    "blockedKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ignoredUsernames" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notifyOnTokenExpiry" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnRuleFailure" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_userId_key" ON "user_settings"("userId");

-- AddForeignKey
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
