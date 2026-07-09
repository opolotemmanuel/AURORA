import { prisma } from "@/lib/db/client"
import type { ScanHistoryContextItem } from "@/lib/ai/types"
import type {
  NaturalRecommendation,
  ProductRecommendation,
  SkinDimension,
} from "@/lib/scan/types"

export const CHAT_SCAN_HISTORY_LIMIT = 3

type GetUserScanHistoryOptions = {
  excludeScanId?: string
  limit?: number
}

function compactDimensions(dimensions: unknown): ScanHistoryContextItem["dimensions"] {
  if (!Array.isArray(dimensions)) return []
  return dimensions
    .filter(
      (item): item is SkinDimension =>
        typeof item === "object" &&
        item !== null &&
        "id" in item &&
        "band" in item,
    )
    .map((item) => ({
      id: String(item.id),
      band: String(item.band),
    }))
}

function compactNaturalRecommendations(
  items: unknown,
): ScanHistoryContextItem["naturalRecommendations"] {
  if (!Array.isArray(items)) return []
  return items
    .filter(
      (item): item is NaturalRecommendation =>
        typeof item === "object" &&
        item !== null &&
        "title" in item &&
        "description" in item,
    )
    .map((item) => ({
      title: item.title,
      description: item.description,
    }))
}

function compactProductRecommendations(
  items: unknown,
): ScanHistoryContextItem["recommendations"] {
  if (!Array.isArray(items)) return []
  return items
    .filter(
      (item): item is ProductRecommendation =>
        typeof item === "object" &&
        item !== null &&
        "id" in item &&
        "name" in item &&
        "reason" in item,
    )
    .map((item) => ({
      id: item.id,
      name: item.name,
      reason: item.reason,
    }))
}

export async function getUserScanHistoryContext(
  userId: string,
  options: GetUserScanHistoryOptions = {},
): Promise<ScanHistoryContextItem[]> {
  const limit = options.limit ?? CHAT_SCAN_HISTORY_LIMIT

  const scans = await prisma.scan.findMany({
    where: {
      userId,
      status: "completed",
      result: { isNot: null },
      ...(options.excludeScanId ? { id: { not: options.excludeScanId } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      result: {
        select: {
          overallBand: true,
          summary: true,
          dimensions: true,
          naturalRecommendations: true,
          recommendations: true,
        },
      },
    },
  })

  return scans.map((scan) => ({
    scanId: scan.id,
    createdAt: scan.createdAt.toISOString(),
    overallBand: scan.result!.overallBand,
    summary: scan.result!.summary ?? "",
    dimensions: compactDimensions(scan.result!.dimensions),
    naturalRecommendations: compactNaturalRecommendations(
      scan.result!.naturalRecommendations,
    ),
    recommendations: compactProductRecommendations(
      scan.result!.recommendations,
    ),
  }))
}
