-- Per-company chat pin (private to the participant).
ALTER TABLE "ThreadParticipant" ADD COLUMN "pinnedAt" TIMESTAMP(3);

CREATE INDEX "ThreadParticipant_companyId_pinnedAt_idx" ON "ThreadParticipant"("companyId", "pinnedAt");
