-- CreateEnum
CREATE TYPE "ChatMessageRole" AS ENUM ('USER', 'ASSISTANT');

-- CreateTable
CREATE TABLE "ReportChatMessage" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "ChatMessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReportChatMessage_reportId_idx" ON "ReportChatMessage"("reportId");

-- CreateIndex
CREATE INDEX "ReportChatMessage_userId_idx" ON "ReportChatMessage"("userId");

-- CreateIndex
CREATE INDEX "ReportChatMessage_createdAt_idx" ON "ReportChatMessage"("createdAt");

-- AddForeignKey
ALTER TABLE "ReportChatMessage" ADD CONSTRAINT "ReportChatMessage_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportChatMessage" ADD CONSTRAINT "ReportChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
