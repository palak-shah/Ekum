-- AlterTable
ALTER TABLE "SavedItem" ADD COLUMN "savedByUserId" TEXT;

-- AddForeignKey
ALTER TABLE "SavedItem" ADD CONSTRAINT "SavedItem_savedByUserId_fkey" FOREIGN KEY ("savedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
