-- CreateTable
CREATE TABLE "Thread" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'direct',
    "visibility" TEXT NOT NULL DEFAULT 'shared',
    "title" TEXT,
    "createdByCompanyId" TEXT NOT NULL,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Thread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThreadParticipant" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'active',
    "alertLevel" TEXT NOT NULL DEFAULT 'all',
    "lastReadAt" TIMESTAMP(3),
    "invitedBy" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "ThreadParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "senderCompanyId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'text',
    "body" TEXT,
    "referenceId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Thread_type_idx" ON "Thread"("type");

-- CreateIndex
CREATE INDEX "ThreadParticipant_companyId_state_idx" ON "ThreadParticipant"("companyId", "state");

-- CreateIndex
CREATE UNIQUE INDEX "ThreadParticipant_threadId_companyId_key" ON "ThreadParticipant"("threadId", "companyId");

-- CreateIndex
CREATE INDEX "Message_threadId_createdAt_idx" ON "Message"("threadId", "createdAt");

-- AddForeignKey
ALTER TABLE "Thread" ADD CONSTRAINT "Thread_createdByCompanyId_fkey" FOREIGN KEY ("createdByCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThreadParticipant" ADD CONSTRAINT "ThreadParticipant_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "Thread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThreadParticipant" ADD CONSTRAINT "ThreadParticipant_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "Thread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderCompanyId_fkey" FOREIGN KEY ("senderCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
