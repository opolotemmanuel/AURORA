/**
 * Seed AI model rate rows for usage-based pricing.
 * Run after migrations: npm run db:seed-rates
 */
import "dotenv/config"

import { prisma } from "../lib/db/client"

async function main() {
  await prisma.aiModelRate.upsert({
    where: {
      provider_modelId: {
        provider: "gemini",
        modelId: "gemini-2.5-flash",
      },
    },
    create: {
      provider: "gemini",
      modelId: "gemini-2.5-flash",
      displayName: "Gemini 2.5 Flash",
      // Google AI Studio published rates (USD per 1M tokens → micro-USD)
      inputMicrosPer1M: 150_000,
      outputMicrosPer1M: 600_000,
      cachedInputMicrosPer1M: 37_500,
      isActive: true,
      isScanDefault: true,
      supportsVision: true,
    },
    update: {
      displayName: "Gemini 2.5 Flash",
      inputMicrosPer1M: 150_000,
      outputMicrosPer1M: 600_000,
      cachedInputMicrosPer1M: 37_500,
      isActive: true,
      isScanDefault: true,
      supportsVision: true,
    },
  })

  console.log("Seeded Gemini 2.5 Flash model rates")
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
