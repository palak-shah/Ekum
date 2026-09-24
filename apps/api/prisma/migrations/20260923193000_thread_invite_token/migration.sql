-- AlterTable
ALTER TABLE "Thread" ADD COLUMN "inviteToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Thread_inviteToken_key" ON "Thread"("inviteToken");
