import type { ScanTier } from "@/generated/prisma/client"

export type { ScanTier }

export const SCAN_TIERS: ScanTier[] = ["start", "regular", "pro"]

export const SCAN_TIER_LABELS: Record<ScanTier, string> = {
  start: "Start",
  regular: "Regular",
  pro: "Pro",
}

export type ThinkingLevel = "minimal" | "low" | "medium" | "high"

export const THINKING_LEVELS: ThinkingLevel[] = [
  "minimal",
  "low",
  "medium",
  "high",
]
