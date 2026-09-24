ALTER TABLE "Thread" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
ALTER TABLE "Thread" ADD COLUMN IF NOT EXISTS "blurb" TEXT;
ALTER TABLE "Thread" ADD COLUMN IF NOT EXISTS "pinnedMessageId" TEXT;

ALTER TABLE "ThreadParticipant" ADD COLUMN IF NOT EXISTS "typingAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "MessageReaction" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageReaction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MessageReaction_messageId_companyId_key" ON "MessageReaction"("messageId", "companyId");
CREATE INDEX IF NOT EXISTS "MessageReaction_messageId_idx" ON "MessageReaction"("messageId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'MessageReaction_messageId_fkey'
  ) THEN
    ALTER TABLE "MessageReaction"
      ADD CONSTRAINT "MessageReaction_messageId_fkey"
      FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'MessageReaction_companyId_fkey'
  ) THEN
    ALTER TABLE "MessageReaction"
      ADD CONSTRAINT "MessageReaction_companyId_fkey"
      FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'MessageReaction_userId_fkey'
  ) THEN
    ALTER TABLE "MessageReaction"
      ADD CONSTRAINT "MessageReaction_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
