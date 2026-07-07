import {
  listAiProviderEvents,
  listAuditLogs,
  listDownloads,
  listReports,
  listScans,
} from "@/lib/backend/report-store"

export async function getAdminAnalytics() {
  const [scans, reports, downloads, aiEvents, auditLogs] = await Promise.all([
    listScans(),
    listReports(),
    listDownloads(),
    listAiProviderEvents(),
    listAuditLogs(),
  ])
  const fallbackReports = reports.filter((report) => report.analysis.source === "fallback")
  const sourceCounts = countBy(scans, (scan) => scan.source)
  const productCounts = countBy(
    reports.flatMap((report) => report.recommendations.map((match) => match.product.name)),
    (name) => name,
  )
  const storedImageCount = scans.filter((scan) => scan.image.stored).length

  return {
    metrics: {
      totalScans: scans.length,
      completedReports: reports.length,
      fallbackReports: fallbackReports.length,
      reportDownloads: downloads.length,
    },
    scanSources: sourceCounts,
    productRecommendations: productCounts,
    recentScans: scans.slice(0, 10),
    recentReports: reports.slice(0, 10),
    downloads: downloads.slice(0, 10),
    aiProviderEvents: aiEvents.slice(0, 10),
    auditLogs: auditLogs.slice(0, 10),
    systemStatus: [
      {
        label: "PostgreSQL persistence",
        status: process.env.DATABASE_URL ? "Configured" : "Missing configuration",
        detail: process.env.DATABASE_URL
          ? "DATABASE_URL is present; analytics are read through Prisma."
          : "DATABASE_URL is not available to the server process.",
      },
      {
        label: "Gemini API key",
        status: process.env.GEMINI_API_KEY ? "Configured" : "Missing configuration",
        detail: process.env.GEMINI_API_KEY
          ? "Server-side key is present. The key value is not exposed."
          : "GEMINI_API_KEY is not available to the server process.",
      },
      {
        label: "Gemini model",
        status: process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash",
        detail: "Model name used by the server-side Gemini adapter.",
      },
      {
        label: "Original image retention",
        status: storedImageCount === 0 ? "Not storing originals" : `${storedImageCount} stored`,
        detail:
          storedImageCount === 0
            ? "Current scan records indicate original images are not stored by default."
            : "Some scan records indicate original images were stored.",
      },
      {
        label: "Admin protection",
        status: "Placeholder",
        detail: "better-auth is not installed, so admin access is currently a typed placeholder.",
      },
    ],
    auth: {
      mode: "placeholder",
      note: "Install better-auth to enforce real admin sessions and roles.",
    },
    persistence: {
      mode: "postgres-prisma",
      note: "Analytics are read from PostgreSQL through Prisma.",
    },
  }
}

function countBy<T>(items: T[], getKey: (item: T) => string) {
  return items.reduce<Record<string, number>>((counts, item) => {
    const key = getKey(item)
    counts[key] = (counts[key] ?? 0) + 1
    return counts
  }, {})
}
