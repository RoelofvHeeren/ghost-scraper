-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('NEXTDOOR', 'REDDIT', 'FACEBOOK', 'CRAIGSLIST', 'MANUAL_IMPORT');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'NOTIFIED', 'CONTACTED', 'CALLED', 'BOOKED', 'WON', 'LOST', 'NOT_A_FIT');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'PAUSED', 'BANNED', 'NEEDS_LOGIN', 'NEEDS_REVIEW');

-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('SCRAPE', 'SCORE', 'ROUTE', 'POST_REPLY', 'LOGIN', 'ERROR');

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "twilioNumber" TEXT,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientService" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "includeWords" TEXT[],
    "excludeWords" TEXT[],
    "minValueUsd" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientServiceArea" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT,
    "zipCodes" TEXT[],
    "radiusMiles" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientServiceArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Source" (
    "id" TEXT NOT NULL,
    "type" "SourceType" NOT NULL,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB NOT NULL,
    "pollSeconds" INTEGER NOT NULL DEFAULT 300,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BotAccount" (
    "id" TEXT NOT NULL,
    "platform" "SourceType" NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT,
    "email" TEXT,
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "sessionData" JSONB,
    "proxyUrl" TEXT,
    "campaignId" TEXT,
    "cityMatches" TEXT[],
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "lastLoginAt" TIMESTAMP(3),
    "lastCaptchaAt" TIMESTAMP(3),
    "loginErrorCount" INTEGER NOT NULL DEFAULT 0,
    "dailyPostCount" INTEGER NOT NULL DEFAULT 0,
    "dailyScrapeCount" INTEGER NOT NULL DEFAULT 0,
    "maxDailyPosts" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BotAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BotSourceAssignment" (
    "id" TEXT NOT NULL,
    "botId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BotSourceAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConnectorState" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "cursorData" JSONB,
    "lastSeenExternalId" TEXT,
    "lastRunAt" TIMESTAMP(3),
    "lastSuccessAt" TIMESTAMP(3),
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConnectorState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationLog" (
    "id" TEXT NOT NULL,
    "action" "ActionType" NOT NULL,
    "sourceId" TEXT,
    "candidateId" TEXT,
    "leadId" TEXT,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "screenshotUrl" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AutomationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadCandidate" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "externalId" TEXT,
    "url" TEXT,
    "title" TEXT,
    "body" TEXT NOT NULL,
    "author" TEXT,
    "postedAt" TIMESTAMP(3),
    "cityHint" TEXT,
    "raw" JSONB,
    "dedupHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "serviceType" TEXT,
    "score" INTEGER NOT NULL DEFAULT 0,
    "reasons" JSONB,
    "suggestedReply" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "phoneTrackingNumber" TEXT,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReplyTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "templateText" TEXT NOT NULL,
    "tone" TEXT,
    "tags" TEXT[],
    "variationGroupId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReplyTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallEvent" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "from" TEXT,
    "to" TEXT,
    "duration" INTEGER,
    "recordingUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CallEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "persona" TEXT NOT NULL DEFAULT 'BUSINESS',
    "status" TEXT NOT NULL DEFAULT 'PAUSED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignStep" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "delayMinutes" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampaignStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearnedSelector" (
    "id" TEXT NOT NULL,
    "platform" "SourceType" NOT NULL,
    "stepName" TEXT NOT NULL,
    "selector" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "hitCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearnedSelector_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BotSourceAssignment_botId_idx" ON "BotSourceAssignment"("botId");

-- CreateIndex
CREATE INDEX "BotSourceAssignment_sourceId_idx" ON "BotSourceAssignment"("sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "BotSourceAssignment_botId_sourceId_key" ON "BotSourceAssignment"("botId", "sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "ConnectorState_sourceId_key" ON "ConnectorState"("sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "LeadCandidate_dedupHash_key" ON "LeadCandidate"("dedupHash");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_candidateId_key" ON "Lead"("candidateId");

-- CreateIndex
CREATE INDEX "CampaignStep_campaignId_order_idx" ON "CampaignStep"("campaignId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "Settings_key_key" ON "Settings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "LearnedSelector_platform_stepName_selector_key" ON "LearnedSelector"("platform", "stepName", "selector");

-- AddForeignKey
ALTER TABLE "ClientService" ADD CONSTRAINT "ClientService_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientServiceArea" ADD CONSTRAINT "ClientServiceArea_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BotAccount" ADD CONSTRAINT "BotAccount_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BotSourceAssignment" ADD CONSTRAINT "BotSourceAssignment_botId_fkey" FOREIGN KEY ("botId") REFERENCES "BotAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BotSourceAssignment" ADD CONSTRAINT "BotSourceAssignment_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConnectorState" ADD CONSTRAINT "ConnectorState_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadCandidate" ADD CONSTRAINT "LeadCandidate_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "LeadCandidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallEvent" ADD CONSTRAINT "CallEvent_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignStep" ADD CONSTRAINT "CampaignStep_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

