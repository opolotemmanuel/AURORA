// Aggregates real, queryable data for the admin Analytics page. Every
// number here traces to a real Postgres query — no invented metrics, no
// placeholders. Reuses existing domain modules wherever the same number is
// already computed elsewhere (the DB/Open-Meteo live checks from
// system-overview.ts, the Gemini success-rate math from ai-services.ts)
// rather than re-deriving them here.
import { prisma } from "@/lib/db"
import { checkDatabaseConnectivity, checkWeatherService } from "@/lib/backend/system-overview"
import { getAiServiceStatus } from "@/lib/backend/ai-services"
import { countUsers, getUserRoleBreakdown, getUserSignupsByDay } from "@/lib/backend/admin-users"
import { countActiveProducts } from "@/lib/backend/product-service"
import { countDoshaProfiles } from "@/lib/dosha/dosha-store"
import {
  countReportFindings,
  countUsersWithRepeatScans,
  getScanCountsByDay,
  getTopRecommendedProducts,
  getTopReportFindings,
} from "@/lib/backend/report-store"

// Below this real Gemini success rate, the platform-health card flips to a
// danger tint instead of a neutral one — a real reliability problem should
// read as one, not blend into the rest of the strip.
export const GEMINI_RELIABILITY_WARNING_THRESHOLD = 60

const TREND_WINDOW_DAYS = 14
const TOP_FINDINGS_LIMIT = 8
const TOP_PRODUCTS_LIMIT = 8

export async function getAdminAnalytics() {
  const since = getStartOfDayNDaysAgo(TREND_WINDOW_DAYS)

  const [
    aiServiceStatus,
    database,
    weather,
    totalUsers,
    activeProducts,
    scanCountsByDay,
    totalFindings,
    topFindings,
    topProducts,
    doshaProfileCount,
    chatActiveUserCount,
    repeatScanUserCount,
    signupCountsByDay,
    roleBreakdown,
  ] = await Promise.all([
    getAiServiceStatus(),
    checkDatabaseConnectivity(),
    checkWeatherService(),
    countUsers(),
    countActiveProducts(),
    getScanCountsByDay(since),
    countReportFindings(),
    getTopReportFindings(TOP_FINDINGS_LIMIT),
    getTopRecommendedProducts(TOP_PRODUCTS_LIMIT),
    countDoshaProfiles(),
    countUsersWithChatActivity(),
    countUsersWithRepeatScans(),
    getUserSignupsByDay(since),
    getUserRoleBreakdown(),
  ])

  const scanTrend = buildDailySeries(scanCountsByDay, TREND_WINDOW_DAYS)
  const scansThisWeek = scanTrend.slice(-7).reduce((total, point) => total + point.count, 0)
  const geminiRatePercent = aiServiceStatus.successRatePercent ?? null

  return {
    platformHealth: {
      geminiReliability: {
        ratePercent: geminiRatePercent,
        successCount: aiServiceStatus.successCount,
        totalCount: aiServiceStatus.totalEvents,
        isLow: geminiRatePercent !== null && geminiRatePercent < GEMINI_RELIABILITY_WARNING_THRESHOLD,
      },
      totalUsers,
      activeProducts,
      scansThisWeek,
      database,
      weather,
    },
    scanTrend,
    topFindings: topFindings.map((finding) => ({
      label: finding.label,
      band: finding.band,
      count: finding.count,
      percent: percentOf(finding.count, totalFindings),
    })),
    topProducts,
    featureAdoption: {
      totalUsers,
      doshaPercent: percentOf(doshaProfileCount, totalUsers),
      chatPercent: percentOf(chatActiveUserCount, totalUsers),
      repeatScanPercent: percentOf(repeatScanUserCount, totalUsers),
    },
    signupTrend: buildDailySeries(signupCountsByDay, TREND_WINDOW_DAYS),
    roleBreakdown: roleBreakdown
      .map((row) => ({ role: row.role, count: row.count, percent: percentOf(row.count, totalUsers) }))
      .sort((a, b) => b.count - a.count),
  }
}

// Real count of users with at least one message in either chat surface
// (report follow-up chat or general skin-advice chat). Spans two tables
// each independently owned by lib/backend/chat-store.ts and
// lib/backend/skin-advice-store.ts, so this cross-cutting union doesn't
// belong to either single-table module — kept here since admin-analytics.ts
// is already the one place that aggregates across domains.
async function countUsersWithChatActivity() {
  const rows = await prisma.$queryRaw<{ count: number }[]>`
    SELECT COUNT(DISTINCT "userId")::int AS count FROM (
      SELECT "userId" FROM "ReportChatMessage"
      UNION
      SELECT "userId" FROM "SkinAdviceMessage"
    ) AS chat_active_users
  `

  return rows[0]?.count ?? 0
}

function getStartOfDayNDaysAgo(days: number) {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() - (days - 1))
  return date
}

// Zero-fills the grouped-by-day rows a store's raw query returns into one
// point per day across the full window, so a chart never has to guess
// whether a missing day means "zero" or "not fetched yet."
function buildDailySeries(rows: { day: Date; count: number }[], days: number) {
  const countsByDate = new Map(rows.map((row) => [toDateKey(row.day), row.count]))
  const start = getStartOfDayNDaysAgo(days)

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    const key = toDateKey(date)
    return { date: key, count: countsByDate.get(key) ?? 0 }
  })
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

function percentOf(count: number, total: number) {
  return total ? Math.round((count / total) * 100) : 0
}
