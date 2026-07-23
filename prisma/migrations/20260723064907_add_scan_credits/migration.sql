-- CreateEnum
CREATE TYPE "ScanLedgerReason" AS ENUM ('SIGNUP_BONUS', 'SCAN_DEBIT', 'ADMIN_GRANT');

-- CreateTable
CREATE TABLE "ScanBalance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "remaining" INTEGER NOT NULL DEFAULT 10,
    "lifetimeGranted" INTEGER NOT NULL DEFAULT 10,
    "lifetimeUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScanBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScanLedger" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "delta" INTEGER NOT NULL,
    "reason" "ScanLedgerReason" NOT NULL,
    "relatedScanId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScanLedger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ScanBalance_userId_key" ON "ScanBalance"("userId");

-- CreateIndex
CREATE INDEX "ScanLedger_userId_idx" ON "ScanLedger"("userId");

-- CreateIndex
CREATE INDEX "ScanLedger_relatedScanId_idx" ON "ScanLedger"("relatedScanId");

-- CreateIndex
CREATE INDEX "ScanLedger_createdAt_idx" ON "ScanLedger"("createdAt");

-- AddForeignKey
ALTER TABLE "ScanBalance" ADD CONSTRAINT "ScanBalance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanLedger" ADD CONSTRAINT "ScanLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanLedger" ADD CONSTRAINT "ScanLedger_relatedScanId_fkey" FOREIGN KEY ("relatedScanId") REFERENCES "Scan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
