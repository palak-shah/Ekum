-- Pack size + buyer download gate on designs and packs.
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "piecesPerPack" INTEGER;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "allowDownload" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Collection" ADD COLUMN IF NOT EXISTS "allowDownload" BOOLEAN NOT NULL DEFAULT false;
