-- Optional voice beside return reason and payment note
ALTER TABLE "Return" ADD COLUMN IF NOT EXISTS "reasonVoiceMediaId" TEXT;
ALTER TABLE "Return" ADD COLUMN IF NOT EXISTS "reasonVoiceUrl" TEXT;
ALTER TABLE "Return" ADD COLUMN IF NOT EXISTS "reasonVoiceDurationMs" INTEGER;

ALTER TABLE "PaymentRequest" ADD COLUMN IF NOT EXISTS "noteVoiceMediaId" TEXT;
ALTER TABLE "PaymentRequest" ADD COLUMN IF NOT EXISTS "noteVoiceUrl" TEXT;
ALTER TABLE "PaymentRequest" ADD COLUMN IF NOT EXISTS "noteVoiceDurationMs" INTEGER;
