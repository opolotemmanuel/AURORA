-- CreateTable
CREATE TABLE "ClimateReading" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "temperatureC" DOUBLE PRECISION NOT NULL,
    "humidityPercent" DOUBLE PRECISION NOT NULL,
    "uvIndex" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClimateReading_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClimateReading_reportId_key" ON "ClimateReading"("reportId");

-- AddForeignKey
ALTER TABLE "ClimateReading" ADD CONSTRAINT "ClimateReading_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;
