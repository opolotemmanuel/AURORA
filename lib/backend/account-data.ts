// Self-service "your data" aggregation for the /account and /privacy pages
// — mirrors admin-analytics.ts's role as a cross-domain aggregator, just
// scoped to one signed-in user's own rows instead of the whole platform.
// Every value here is a real query; callers must pass the session's own
// userId, never another user's.
import { countReportChatMessagesForUser } from "@/lib/backend/chat-store"
import { countReportsForUser, countScansForUser, listReportsForUser } from "@/lib/backend/report-store"
import { countSkinAdviceMessagesForUser } from "@/lib/backend/skin-advice-store"
import { getDoshaProfile } from "@/lib/dosha/dosha-store"

// Generous-but-bounded — enough to export any reasonably active user's
// full report history without an unbounded query (same reasoning as
// app/(dashboard)/account/page.tsx's CLIMATE_LOOKBACK_REPORT_COUNT).
const DATA_EXPORT_REPORT_LIMIT = 1000

export async function getYourDataSummary(userId: string) {
  const [totalScans, totalReports, reportChatCount, skinAdviceCount, doshaProfile] = await Promise.all([
    countScansForUser(userId),
    countReportsForUser(userId),
    countReportChatMessagesForUser(userId),
    countSkinAdviceMessagesForUser(userId),
    getDoshaProfile(userId),
  ])

  return {
    totalScans,
    totalReports,
    totalChatMessages: reportChatCount + skinAdviceCount,
    hasDoshaProfile: doshaProfile !== null,
  }
}

// Real export of a user's own reports and findings — no scan images (those
// aren't stored by default, see prisma/schema.prisma's ClimateReading doc
// comment on this app's retention model) and no other user's data.
export async function buildUserDataExport(userId: string, email: string) {
  const reports = await listReportsForUser(userId, DATA_EXPORT_REPORT_LIMIT)

  return {
    exportedAt: new Date().toISOString(),
    account: { email },
    reports: reports.map((report) => ({
      id: report.id,
      createdAt: report.createdAt,
      summary: report.analysis.summary,
      source: report.analysis.source,
      findings: report.analysis.cosmeticFindings,
      recommendations: report.recommendations.map((recommendation) => ({
        product: recommendation.product.name,
        category: recommendation.product.category,
        matchStrength: recommendation.matchStrength,
        reasons: recommendation.reasons,
      })),
      routineTips: report.analysis.routineTips,
      climate: report.climate ?? null,
    })),
  }
}
