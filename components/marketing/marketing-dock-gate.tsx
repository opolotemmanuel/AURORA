"use client"

import { usePathname } from "next/navigation"

import { MarketingDock } from "@/components/marketing/marketing-dock"

const DOCK_PATHS = new Set(["/", "/privacy", "/terms"])

export function MarketingDockGate() {
  const pathname = usePathname()
  if (!DOCK_PATHS.has(pathname)) return null
  return <MarketingDock />
}
