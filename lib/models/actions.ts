"use server"

import { revalidatePath, revalidateTag } from "next/cache"

import { requireAdmin } from "@/lib/auth/session"
import { prisma } from "@/lib/db/client"
import { ACTIVE_SCAN_MODEL_TAG } from "@/lib/models/queries"
import { modelRateFormSchema } from "@/lib/models/schemas"

const MODELS_PATH = "/admin/models"

function revalidateModelCaches() {
  revalidatePath(MODELS_PATH)
  revalidatePath("/admin/tokens")
  revalidateTag(ACTIVE_SCAN_MODEL_TAG, "max")
}

export async function createModelRateAction(input: unknown) {
  await requireAdmin()
  const data = modelRateFormSchema.parse(input)

  const model = await prisma.aiModelRate.create({
    data: {
      provider: data.provider,
      modelId: data.modelId,
      displayName: data.displayName || null,
      inputMicrosPer1M: data.inputMicrosPer1M,
      outputMicrosPer1M: data.outputMicrosPer1M,
      cachedInputMicrosPer1M: data.cachedInputMicrosPer1M,
      isActive: data.isActive,
      supportsVision: data.supportsVision,
    },
  })

  revalidateModelCaches()
  return model
}

export async function updateModelRateAction(id: string, input: unknown) {
  await requireAdmin()
  const data = modelRateFormSchema.parse(input)

  const model = await prisma.aiModelRate.update({
    where: { id },
    data: {
      provider: data.provider,
      modelId: data.modelId,
      displayName: data.displayName || null,
      inputMicrosPer1M: data.inputMicrosPer1M,
      outputMicrosPer1M: data.outputMicrosPer1M,
      cachedInputMicrosPer1M: data.cachedInputMicrosPer1M,
      isActive: data.isActive,
      supportsVision: data.supportsVision,
    },
  })

  revalidateModelCaches()
  return model
}

export async function setActiveScanModelAction(id: string) {
  await requireAdmin()

  const target = await prisma.aiModelRate.findUnique({ where: { id } })
  if (!target) {
    throw new Error("Model not found")
  }
  if (!target.isActive) {
    throw new Error("Activate the model before setting it as default for scans")
  }
  if (!target.supportsVision) {
    throw new Error("Only vision-capable models can be used for scans")
  }

  await prisma.$transaction([
    prisma.aiModelRate.updateMany({
      where: { isScanDefault: true },
      data: { isScanDefault: false },
    }),
    prisma.aiModelRate.update({
      where: { id },
      data: { isScanDefault: true },
    }),
  ])

  revalidateModelCaches()
}
