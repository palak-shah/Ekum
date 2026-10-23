-- Pack Rate per / 1 set contains live on the collection (editor identity).
ALTER TABLE "Collection" ADD COLUMN "unit" TEXT;
ALTER TABLE "Collection" ADD COLUMN "dispatchUnit" TEXT;
ALTER TABLE "Collection" ADD COLUMN "piecesPerPack" INTEGER;
