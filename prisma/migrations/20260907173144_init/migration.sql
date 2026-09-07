-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'EDITOR',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ContentPillar" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IDEA',
    "platform" TEXT,
    "caption" TEXT,
    "graphicStatus" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "publishDate" DATETIME,
    "contentPillarId" TEXT,
    "ownerId" TEXT,
    "alumnusId" TEXT,
    "bankEntryId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Post_contentPillarId_fkey" FOREIGN KEY ("contentPillarId") REFERENCES "ContentPillar" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Post_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Post_alumnusId_fkey" FOREIGN KEY ("alumnusId") REFERENCES "Alumnus" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Post_bankEntryId_fkey" FOREIGN KEY ("bankEntryId") REFERENCES "ContentBankEntry" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ApprovalEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "note" TEXT,
    "actorId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ApprovalEvent_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ApprovalEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContentBankEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "idea" TEXT NOT NULL,
    "captionDraft" TEXT,
    "evergreen" BOOLEAN NOT NULL DEFAULT true,
    "graphicNeeded" BOOLEAN NOT NULL DEFAULT false,
    "lastPosted" DATETIME,
    "performanceNotes" TEXT,
    "contentPillarId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ContentBankEntry_contentPillarId_fkey" FOREIGN KEY ("contentPillarId") REFERENCES "ContentPillar" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Alumnus" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "cohortYear" INTEGER,
    "currentOrganization" TEXT,
    "currentRole" TEXT,
    "linkedin" TEXT,
    "featuredStatus" TEXT NOT NULL DEFAULT 'NOT_FEATURED',
    "careerUpdates" TEXT,
    "awards" TEXT,
    "boardMemberships" TEXT,
    "storyCollected" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AssetLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AnalyticsSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "periodStart" DATETIME NOT NULL,
    "periodEnd" DATETIME NOT NULL,
    "platform" TEXT NOT NULL,
    "followers" INTEGER,
    "reach" INTEGER,
    "engagement" INTEGER,
    "impressions" INTEGER,
    "clicks" INTEGER,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ContentPillar_name_key" ON "ContentPillar"("name");

-- CreateIndex
CREATE INDEX "Post_publishDate_idx" ON "Post"("publishDate");

-- CreateIndex
CREATE INDEX "Post_status_idx" ON "Post"("status");

-- CreateIndex
CREATE INDEX "ApprovalEvent_postId_idx" ON "ApprovalEvent"("postId");

-- CreateIndex
CREATE INDEX "AnalyticsSnapshot_periodStart_idx" ON "AnalyticsSnapshot"("periodStart");
