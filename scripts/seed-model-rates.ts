/**
 * Seed AI model rate rows for usage-based pricing.
 * Run after migrations: npm run db:seed-rates
 */
import "dotenv/config"

import type { ScanTier } from "../generated/prisma/client"
import { prisma } from "../lib/db/client"

type ModelSeed = {
  modelId: string
  displayName: string
  inputMicrosPer1M: number
  outputMicrosPer1M: number
  cachedInputMicrosPer1M: number
  isActive: boolean
  isScanDefault: boolean
  supportsVision: boolean
  supportsLive: boolean
  assignedTier: ScanTier | null
  thinkingLevel: string | null
}

const MODELS: ModelSeed[] = [
  {
    modelId: "gemini-2.5-flash",
    displayName: "Gemini 2.5 Flash",
    inputMicrosPer1M: 150_000,
    outputMicrosPer1M: 600_000,
    cachedInputMicrosPer1M: 37_500,
    isActive: true,
    isScanDefault: true,
    supportsVision: true,
    supportsLive: false,
    assignedTier: "start",
    thinkingLevel: "low",
  },
  {
    modelId: "gemini-3.5-flash",
    displayName: "Gemini 3.5 Flash",
    inputMicrosPer1M: 1_500_000,
    outputMicrosPer1M: 9_000_000,
    cachedInputMicrosPer1M: 150_000,
    isActive: true,
    isScanDefault: false,
    supportsVision: true,
    supportsLive: false,
    assignedTier: "regular",
    thinkingLevel: "medium",
  },
  {
    modelId: "gemini-3.5-pro",
    displayName: "Gemini 3.5 Pro",
    inputMicrosPer1M: 15_000_000,
    outputMicrosPer1M: 60_000_000,
    cachedInputMicrosPer1M: 3_750_000,
    isActive: false,
    isScanDefault: false,
    supportsVision: true,
    supportsLive: false,
    assignedTier: null,
    thinkingLevel: "high",
  },
  {
    modelId: "gemini-3.1-flash-live-preview",
    displayName: "Gemini 3.1 Flash Live",
    // Live API pricing approximated from standard flash rates
    inputMicrosPer1M: 1_500_000,
    outputMicrosPer1M: 9_000_000,
    cachedInputMicrosPer1M: 150_000,
    isActive: true,
    isScanDefault: false,
    supportsVision: true,
    supportsLive: true,
    assignedTier: "pro",
    thinkingLevel: null,
  },
  {
    modelId: "gemini-omni-flash-preview",
    displayName: "Gemini Omni Flash (reference)",
    inputMicrosPer1M: 100_000,
    outputMicrosPer1M: 100_000,
    cachedInputMicrosPer1M: 0,
    isActive: false,
    isScanDefault: false,
    supportsVision: false,
    supportsLive: false,
    assignedTier: null,
    thinkingLevel: null,
  },
]

async function main() {
  for (const model of MODELS) {
    await prisma.aiModelRate.upsert({
      where: {
        provider_modelId: {
          provider: "gemini",
          modelId: model.modelId,
        },
      },
      create: {
        provider: "gemini",
        ...model,
      },
      update: {
        displayName: model.displayName,
        inputMicrosPer1M: model.inputMicrosPer1M,
        outputMicrosPer1M: model.outputMicrosPer1M,
        cachedInputMicrosPer1M: model.cachedInputMicrosPer1M,
        isActive: model.isActive,
        isScanDefault: model.isScanDefault,
        supportsVision: model.supportsVision,
        supportsLive: model.supportsLive,
        assignedTier: model.assignedTier,
        thinkingLevel: model.thinkingLevel,
      },
    })
  }

  console.log(`Seeded ${MODELS.length} Gemini model rates`)
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
