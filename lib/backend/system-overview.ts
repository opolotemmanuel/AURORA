// Real, live-checked data for the Enterprise Settings "Overview" tab — one
// module per AGENTS.md's "each domain gets its own module" rule. Every
// value here comes from an actual query or an actual live network call;
// nothing is invented. See app/(dashboard)/settings/page.tsx for the caller.
import packageJson from "@/package.json"
import { prisma } from "@/lib/db"
import { getClimateSnapshot } from "@/lib/climate/adapter"
import { countScansToday, listAiProviderEvents } from "@/lib/backend/report-store"
import { countUsers } from "@/lib/backend/admin-users"
import { listProducts } from "@/lib/backend/product-service"

export type LiveCheckStatus = "reachable" | "unreachable" | "not_configured"

export type LiveCheck = {
  label: string
  status: LiveCheckStatus
  detail: string
  latencyMs?: number
}

// Fixed, unremarkable coordinates (mid-Atlantic) used only to prove Open-
// Meteo is reachable — never derived from a real user's location, unlike
// the per-scan coordinates in app/api/scan/analyze/route.ts.
const WEATHER_PROBE_LATITUDE = 38.7
const WEATHER_PROBE_LONGITUDE = -28.2

export async function getPlatformVersion() {
  return packageJson.version
}

export async function checkDatabaseConnectivity(): Promise<LiveCheck> {
  const startedAt = Date.now()

  try {
    await prisma.$queryRaw`SELECT 1`
    return {
      label: "PostgreSQL",
      status: "reachable",
      detail: "A live SELECT 1 query succeeded against the configured database.",
      latencyMs: Date.now() - startedAt,
    }
  } catch (error) {
    return {
      label: "PostgreSQL",
      status: "unreachable",
      detail: error instanceof Error ? error.message : "The live connectivity check failed.",
      latencyMs: Date.now() - startedAt,
    }
  }
}

export async function checkWeatherService(): Promise<LiveCheck> {
  const startedAt = Date.now()
  const snapshot = await getClimateSnapshot(WEATHER_PROBE_LATITUDE, WEATHER_PROBE_LONGITUDE)

  return snapshot
    ? {
        label: "Open-Meteo",
        status: "reachable",
        detail: "A live forecast request to Open-Meteo succeeded.",
        latencyMs: Date.now() - startedAt,
      }
    : {
        label: "Open-Meteo",
        status: "unreachable",
        detail: "A live forecast request to Open-Meteo failed or timed out.",
        latencyMs: Date.now() - startedAt,
      }
}

// Deliberately NOT a live Gemini call (that costs real quota — see the
// AI Services tab's "Test AI" button for the opt-in version of that check).
// This reads the most recent real AiProviderEvent instead, which is a
// genuine signal of recent Gemini health without spending anything.
export async function getGeminiSignal(): Promise<LiveCheck> {
  if (!process.env.GEMINI_API_KEY) {
    return {
      label: "Gemini",
      status: "not_configured",
      detail: "GEMINI_API_KEY is not available to the server process.",
    }
  }

  const events = await listAiProviderEvents()
  const latest = events[0]

  if (!latest) {
    return {
      label: "Gemini",
      status: "not_configured",
      detail: "GEMINI_API_KEY is configured, but no Gemini calls have been recorded yet.",
    }
  }

  return {
    label: "Gemini",
    status: latest.status === "success" ? "reachable" : "unreachable",
    detail: `Most recent recorded call ${latest.status === "success" ? "succeeded" : latest.status} at ${latest.createdAt}.`,
  }
}

export async function getOverviewCounts() {
  const [totalUsers, products, todayScans] = await Promise.all([
    countUsers(),
    listProducts(),
    countScansToday(),
  ])

  return {
    totalUsers,
    activeProducts: products.filter((product) => product.active).length,
    todayScans,
  }
}
