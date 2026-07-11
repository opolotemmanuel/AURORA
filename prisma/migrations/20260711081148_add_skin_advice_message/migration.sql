-- CreateTable
CREATE TABLE "SkinAdviceMessage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "ChatMessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkinAdviceMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SkinAdviceMessage_userId_idx" ON "SkinAdviceMessage"("userId");

-- CreateIndex
CREATE INDEX "SkinAdviceMessage_createdAt_idx" ON "SkinAdviceMessage"("createdAt");

-- AddForeignKey
ALTER TABLE "SkinAdviceMessage" ADD CONSTRAINT "SkinAdviceMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
