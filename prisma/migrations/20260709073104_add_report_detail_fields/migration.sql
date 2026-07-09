-- AlterTable
ALTER TABLE "AiProviderEvent" ADD COLUMN     "durationMs" INTEGER;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "keyIngredients" JSONB,
ADD COLUMN     "officialUrl" TEXT;

-- AlterTable
ALTER TABLE "Scan" ADD COLUMN     "imageHeight" INTEGER,
ADD COLUMN     "imageWidth" INTEGER,
ADD COLUMN     "userAgent" TEXT;
