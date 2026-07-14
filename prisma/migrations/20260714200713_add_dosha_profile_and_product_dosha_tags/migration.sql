-- CreateEnum
CREATE TYPE "DoshaType" AS ENUM ('VATA', 'PITTA', 'KAPHA');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "doshaTags" JSONB;

-- CreateTable
CREATE TABLE "DoshaProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "primaryDosha" "DoshaType" NOT NULL,
    "secondaryDosha" "DoshaType",
    "breakdown" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DoshaProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DoshaProfile_userId_key" ON "DoshaProfile"("userId");

-- CreateIndex
CREATE INDEX "DoshaProfile_primaryDosha_idx" ON "DoshaProfile"("primaryDosha");

-- AddForeignKey
ALTER TABLE "DoshaProfile" ADD CONSTRAINT "DoshaProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
