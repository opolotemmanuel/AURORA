import { cache } from "react"
import { unstable_cache } from "next/cache"

import { prisma } from "@/lib/db/client"
import { withDbRetry } from "@/lib/db/retry"

export const ACTIVE_SCAN_MODEL_TAG = "active-scan-model"

export const getActiveScanModel = unstable_cache(
  async () => {
    return withDbRetry(() =>
      prisma.aiModelRate.findFirst({
        where: {
          isScanDefault: true,
          isActive: true,
          supportsVision: true,
        },
      }),
    )
  },
  ["active-scan-model"],
  { tags: [ACTIVE_SCAN_MODEL_TAG] },
)

export const listModelRates = cache(async () => {
  return prisma.aiModelRate.findMany({
    orderBy: [{ isScanDefault: "desc" }, { displayName: "asc" }, { modelId: "asc" }],
  })
})
