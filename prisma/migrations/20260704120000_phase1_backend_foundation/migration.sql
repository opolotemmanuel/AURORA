-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'OWNER', 'SUPPORT', 'PRIVACY');

-- CreateEnum
CREATE TYPE "ScanSource" AS ENUM ('CAMERA', 'UPLOAD', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "ScanStatus" AS ENUM ('RECEIVED', 'ANALYZED', 'FALLBACK', 'FAILED');

-- CreateEnum
CREATE TYPE "ReportSource" AS ENUM ('GEMINI', 'FALLBACK', 'RULE_BASED');

-- CreateEnum
CREATE TYPE "RoutineStep" AS ENUM ('CLEANSE', 'TREAT', 'MOISTURIZE', 'PROTECT');

-- CreateEnum
CREATE TYPE "MatchStrength" AS ENUM ('PRIMARY', 'SUPPORTING', 'OPTIONAL');

-- CreateEnum
CREATE TYPE "DownloadFormat" AS ENUM ('PRINT_HTML', 'PDF');

-- CreateEnum
CREATE TYPE "AiProviderStatus" AS ENUM ('SUCCESS', 'FALLBACK', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scan" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "source" "ScanSource" NOT NULL DEFAULT 'UNKNOWN',
    "status" "ScanStatus" NOT NULL DEFAULT 'RECEIVED',
    "imageFileName" TEXT,
    "imageMimeType" TEXT,
    "imageSizeBytes" INTEGER,
    "originalImageStored" BOOLEAN NOT NULL DEFAULT false,
    "imageStorageKey" TEXT,
    "qualityLighting" TEXT,
    "qualityFraming" TEXT,
    "qualityConfidence" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Scan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "scanId" TEXT NOT NULL,
    "userId" TEXT,
    "summary" TEXT NOT NULL,
    "source" "ReportSource" NOT NULL,
    "model" TEXT NOT NULL,
    "disclaimer" TEXT NOT NULL,
    "fallbackReason" TEXT,
    "routineTips" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportFinding" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "concern" TEXT,
    "band" TEXT NOT NULL,
    "observation" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportFinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "routineStep" "RoutineStep" NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "cosmeticBenefits" JSONB NOT NULL,
    "bestFor" JSONB NOT NULL,
    "avoidIf" JSONB,
    "priority" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recommendation" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "productId" TEXT,
    "productSlug" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "productCategory" TEXT NOT NULL,
    "routineStep" "RoutineStep" NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "cosmeticBenefits" JSONB NOT NULL,
    "rank" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "matchStrength" "MatchStrength" NOT NULL,
    "reasons" JSONB NOT NULL,
    "productSnapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportDownload" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "format" "DownloadFormat" NOT NULL,
    "userId" TEXT,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportDownload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "actorRole" "UserRole",
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiProviderEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "status" "AiProviderStatus" NOT NULL,
    "scanId" TEXT,
    "reportId" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiProviderEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "Scan_userId_idx" ON "Scan"("userId");

-- CreateIndex
CREATE INDEX "Scan_status_idx" ON "Scan"("status");

-- CreateIndex
CREATE INDEX "Scan_source_idx" ON "Scan"("source");

-- CreateIndex
CREATE INDEX "Scan_createdAt_idx" ON "Scan"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Report_scanId_key" ON "Report"("scanId");

-- CreateIndex
CREATE INDEX "Report_userId_idx" ON "Report"("userId");

-- CreateIndex
CREATE INDEX "Report_source_idx" ON "Report"("source");

-- CreateIndex
CREATE INDEX "Report_createdAt_idx" ON "Report"("createdAt");

-- CreateIndex
CREATE INDEX "ReportFinding_reportId_idx" ON "ReportFinding"("reportId");

-- CreateIndex
CREATE INDEX "ReportFinding_band_idx" ON "ReportFinding"("band");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_active_idx" ON "Product"("active");

-- CreateIndex
CREATE INDEX "Product_routineStep_idx" ON "Product"("routineStep");

-- CreateIndex
CREATE INDEX "Recommendation_reportId_idx" ON "Recommendation"("reportId");

-- CreateIndex
CREATE INDEX "Recommendation_productId_idx" ON "Recommendation"("productId");

-- CreateIndex
CREATE INDEX "Recommendation_rank_idx" ON "Recommendation"("rank");

-- CreateIndex
CREATE INDEX "Recommendation_productSlug_idx" ON "Recommendation"("productSlug");

-- CreateIndex
CREATE INDEX "ReportDownload_reportId_idx" ON "ReportDownload"("reportId");

-- CreateIndex
CREATE INDEX "ReportDownload_format_idx" ON "ReportDownload"("format");

-- CreateIndex
CREATE INDEX "ReportDownload_createdAt_idx" ON "ReportDownload"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_targetType_targetId_idx" ON "AuditLog"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AiProviderEvent_provider_idx" ON "AiProviderEvent"("provider");

-- CreateIndex
CREATE INDEX "AiProviderEvent_status_idx" ON "AiProviderEvent"("status");

-- CreateIndex
CREATE INDEX "AiProviderEvent_createdAt_idx" ON "AiProviderEvent"("createdAt");

-- CreateIndex
CREATE INDEX "AiProviderEvent_scanId_idx" ON "AiProviderEvent"("scanId");

-- CreateIndex
CREATE INDEX "AiProviderEvent_reportId_idx" ON "AiProviderEvent"("reportId");

-- AddForeignKey
ALTER TABLE "Scan" ADD CONSTRAINT "Scan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "Scan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportFinding" ADD CONSTRAINT "ReportFinding_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportDownload" ADD CONSTRAINT "ReportDownload_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportDownload" ADD CONSTRAINT "ReportDownload_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiProviderEvent" ADD CONSTRAINT "AiProviderEvent_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE SET NULL ON UPDATE CASCADE;
