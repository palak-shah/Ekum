-- Business Profile: cover, showcase, Public/Private, company contact phone.
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "coverUrl" TEXT;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "showcaseUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "profileVisibility" TEXT NOT NULL DEFAULT 'public';
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "contactPhone" TEXT;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "showContactPhone" BOOLEAN NOT NULL DEFAULT false;
