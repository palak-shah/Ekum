-- Optional Business Profile hours, shop street address (city stays Company.city), website.
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "opensAt" TEXT;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "closesAt" TEXT;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "weeklyOff" TEXT;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "addressUnit" TEXT;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "addressStreet" TEXT;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "addressArea" TEXT;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "addressPincode" TEXT;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "websiteUrl" TEXT;
