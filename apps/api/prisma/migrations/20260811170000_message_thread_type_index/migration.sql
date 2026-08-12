-- Support Media/Orders scoped thread message lists.
CREATE INDEX "Message_threadId_type_createdAt_idx" ON "Message"("threadId", "type", "createdAt");
