-- AlterTable
ALTER TABLE "CompanyMembership" ADD COLUMN "archivedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN "recipientUserId" TEXT;

-- CreateTable
CREATE TABLE "ThreadMember" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'active',
    "alertLevel" TEXT NOT NULL DEFAULT 'all',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "ThreadMember_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ThreadMember_threadId_userId_key" ON "ThreadMember"("threadId", "userId");
CREATE INDEX "ThreadMember_companyId_state_idx" ON "ThreadMember"("companyId", "state");
CREATE INDEX "ThreadMember_userId_state_idx" ON "ThreadMember"("userId", "state");
CREATE INDEX "Notification_recipientUserId_readAt_idx" ON "Notification"("recipientUserId", "readAt");

ALTER TABLE "ThreadMember" ADD CONSTRAINT "ThreadMember_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "Thread"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ThreadMember" ADD CONSTRAINT "ThreadMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Shared threads: keep owners + staff who already had chats cap
INSERT INTO "ThreadMember" ("id", "threadId", "userId", "companyId", "state", "alertLevel", "joinedAt")
SELECT
  md5(p."threadId" || m."userId"),
  p."threadId",
  m."userId",
  p."companyId",
  'active',
  'all',
  CURRENT_TIMESTAMP
FROM "ThreadParticipant" p
JOIN "Thread" t ON t."id" = p."threadId"
JOIN "CompanyMembership" m ON m."companyId" = p."companyId"
WHERE p."state" IN ('active', 'pending')
  AND t."visibility" = 'shared'
  AND (m."role" = 'owner' OR m."canChats" = true)
ON CONFLICT ("threadId", "userId") DO NOTHING;

-- Leftover owner_only threads: owners only
INSERT INTO "ThreadMember" ("id", "threadId", "userId", "companyId", "state", "alertLevel", "joinedAt")
SELECT
  md5(p."threadId" || m."userId"),
  p."threadId",
  m."userId",
  p."companyId",
  'active',
  'all',
  CURRENT_TIMESTAMP
FROM "ThreadParticipant" p
JOIN "Thread" t ON t."id" = p."threadId"
JOIN "CompanyMembership" m ON m."companyId" = p."companyId"
WHERE p."state" IN ('active', 'pending')
  AND t."visibility" = 'owner_only'
  AND m."role" = 'owner'
ON CONFLICT ("threadId", "userId") DO NOTHING;
