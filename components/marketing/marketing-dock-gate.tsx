"use client"

import { usePathname } from "next/navigation"

import { MarketingDock } from "@/components/marketing/marketing-dock"

// Review also gates on "/terms" — we don't have that route, so it's
// dropped here rather than gating on a path that can never match.
const DOCK_PATHS = new Set(["/", "/privacy"])

export function MarketingDockGate() {
  const pathname = usePathname()
  if (!DOCK_PATHS.has(pathname)) return null
  return <MarketingDock />
}
