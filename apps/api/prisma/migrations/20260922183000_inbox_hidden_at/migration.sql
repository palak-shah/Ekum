-- Inbox Archive/Delete: hide the row for our company without archiving the participant
-- (archived + inbound message would restore as Requests).
ALTER TABLE "ThreadParticipant" ADD COLUMN IF NOT EXISTS "inboxHiddenAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "ThreadParticipant_companyId_inboxHiddenAt_idx" ON "ThreadParticipant"("companyId", "inboxHiddenAt");
