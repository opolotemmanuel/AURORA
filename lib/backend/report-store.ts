// The Prisma data-access layer for scans, reports, downloads, audit logs,
// and AI provider events. This is the only file that talks to Prisma for
// these models — callers (scan-service, admin-analytics, API routes) only
// see the domain types from lib/backend/types.ts, never raw Prisma rows.
// Below the CRUD-style exports, most of the file is `toPrisma*`/`fromPrisma*`
// pairs that translate between the domain's string-literal unions (e.g.
// StoredScan["source"]) and Prisma's generated enums (e.g. ScanSource) —
// that boilerplate exists so the rest of the app never has to import
// anything from lib/generated/prisma directly.
import {
  AiProviderStatus,
  DownloadFormat,
  MatchStrength,
  ReportSource,
  RoutineStep,
  ScanSource,
  ScanStatus,
  UserRole,
  type Prisma,
} from "@/lib/generated/prisma/client"
import { prisma } from "@/lib/db"
import type {
  AiProviderEvent,
  AuditLogEntry,
  DownloadFormat as DomainDownloadFormat,
  ReportDownload,
  StoredReport,
  StoredReportBundle,
  StoredScan,
} from "@/lib/backend/types"
import type { AuroraProduct, RecommendationMatch } from "@/lib/recommendations/types"

type ReportWithRelations = Awaited<ReturnType<typeof getReportWithRelations>>
type ScanWithRelations = Awaited<ReturnType<typeof getScanWithRelations>>

export type ReportTableStatus = "completed" | "pending" | "failed" | "archived"
export type ReportTableSort = "newest" | "oldest" | "reportId" | "status" | "aiSource" | "created" | "updated"
export type ReportTableQuery = {
  page: number
  pageSize: number
  search?: string
  aiSource?: "gemini" | "fallback"
  status?: ReportTableStatus
  scanSource?: "camera" | "upload"
  dateRange?: "today" | "week" | "month"
  sort?: ReportTableSort
  // Set by callers to restrict results to one user's own reports (see
  // app/api/reports/route.ts and app/(dashboard)/reports/page.tsx) — admin-
  // tier callers omit this to see every report.
  userId?: string
}

// Writes the scan, its report, findings, and recommendations in a single
// nested Prisma `create` (one insert graph) rather than separate calls, so
// a scan never ends up persisted without its report or vice versa.
export async function saveReportBundle(bundle: StoredReportBundle) {
  await prisma.scan.create({
    data: {
      id: bundle.scan.id,
      userId: bundle.scan.userId,
      source: toPrismaScanSource(bundle.scan.source),
      status: toPrismaScanStatus(bundle.scan.status),
      imageFileName: bundle.scan.image.fileName,
      imageMimeType: bundle.scan.image.mimeType,
      imageSizeBytes: bundle.scan.image.size,
      imageWidth: bundle.scan.image.width,
      imageHeight: bundle.scan.image.height,
      userAgent: bundle.scan.userAgent,
      originalImageStored: bundle.scan.image.stored,
      qualityLighting: bundle.report.analysis.quality.lighting,
      qualityFraming: bundle.report.analysis.quality.framing,
      qualityConfidence: bundle.report.analysis.quality.confidence,
      createdAt: new Date(bundle.scan.createdAt),
      updatedAt: new Date(bundle.scan.updatedAt),
      report: {
        create: {
          id: bundle.report.id,
          userId: bundle.report.userId,
          summary: bundle.report.analysis.summary,
          source: toPrismaReportSource(bundle.report.analysis.source),
          model: bundle.report.analysis.model,
          disclaimer: bundle.report.analysis.disclaimer,
          fallbackReason: bundle.report.fallbackReason,
          routineTips: bundle.report.analysis.routineTips,
          createdAt: new Date(bundle.report.createdAt),
          updatedAt: new Date(bundle.report.updatedAt),
          findings: {
            create: bundle.report.analysis.cosmeticFindings.map((finding, index) => ({
              label: finding.label,
              concern: finding.concern,
              band: finding.band,
              observation: finding.observation,
              sortOrder: index,
            })),
          },
          recommendations: {
            create: bundle.report.recommendations.map((recommendation) => ({
              productId: recommendation.product.databaseId,
              productSlug: recommendation.product.id,
              productName: recommendation.product.name,
              productCategory: recommendation.product.category,
              routineStep: toPrismaRoutineStep(recommendation.routineStep),
              shortDescription: recommendation.product.shortDescription,
              cosmeticBenefits: recommendation.product.cosmeticBenefits,
              rank: recommendation.rank,
              score: Math.round(recommendation.score),
              matchStrength: toPrismaMatchStrength(recommendation.matchStrength),
              reasons: recommendation.reasons,
              // Full product snapshot at recommendation time (as opposed to
              // just a foreign key) so a historic report keeps showing what
              // was actually recommended even after the product catalog
              // changes or a product is later removed — see
              // getProductSnapshot below, which prefers this over a live
              // lookup.
              productSnapshot: recommendation.product,
            })),
          },
          // Readings only — see prisma/schema.prisma's ClimateReading doc
          // comment. Only created when a snapshot actually exists (Open-Meteo
          // succeeded for this scan); absent stays absent, no placeholder row.
          climateReading: bundle.report.climate
            ? {
                create: {
                  temperatureC: bundle.report.climate.temperatureC,
                  humidityPercent: bundle.report.climate.humidityPercent,
                  uvIndex: bundle.report.climate.uvIndex,
                },
              }
            : undefined,
        },
      },
    },
  })

  return bundle
}

export async function listScans() {
  const scans = await prisma.scan.findMany({
    orderBy: { createdAt: "desc" },
    include: { report: true },
  })

  return scans.map(mapScan)
}

export async function listReports() {
  const reports = await prisma.report.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      findings: { orderBy: { sortOrder: "asc" } },
      recommendations: { orderBy: { rank: "asc" } },
      climateReading: true,
    },
  })

  return reports.map(mapReport)
}

// Backs the admin reports table: search + filter + sort + paginate in one
// query, running the count and the page fetch in parallel since neither
// depends on the other.
export async function listReportsPage(query: ReportTableQuery) {
  const page = Math.max(1, query.page)
  const pageSize = clampPageSize(query.pageSize)
  const where = buildReportWhere(query)
  const orderBy = getReportOrderBy(query.sort)
  const [total, reports] = await Promise.all([
    prisma.report.count({ where }),
    prisma.report.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        scan: true,
        user: true,
        recommendations: { orderBy: { rank: "asc" } },
        _count: {
          select: {
            downloads: true,
          },
        },
      },
    }),
  ])

  return {
    reports: reports.map((report) => ({
      id: report.id,
      shortId: shortenReportId(report.id),
      user: {
        name: report.user?.name ?? undefined,
        email: report.user?.email ?? undefined,
        id: report.userId ?? undefined,
      },
      scanSource: fromPrismaScanSource(report.scan.source),
      aiSource: fromPrismaReportSource(report.source),
      status: getReportTableStatus(report.scan.status),
      summary: report.summary,
      recommendationCount: report.recommendations.length,
      recommendationNames: report.recommendations.slice(0, 3).map((recommendation) => recommendation.productName),
      downloadCount: report._count.downloads,
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
    })),
    pagination: {
      page,
      pageSize,
      total,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
    },
    lastUpdated: new Date().toISOString(),
  }
}

// Also reused by the Profile page (app/(dashboard)/profile/page.tsx) — same
// "a signed-in user's own basic profile fields" shape either way, just
// looked up by report ownership there vs. the session's own id here.
export async function findReportOwner(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, image: true, role: true, createdAt: true },
  })

  if (!user) return null

  return {
    id: user.id,
    name: user.name ?? undefined,
    email: user.email,
    image: user.image ?? undefined,
    role: user.role,
    createdAt: user.createdAt,
  }
}

export async function findReport(reportId: string) {
  const report = await getReportWithRelations(reportId)
  return report ? mapReport(report) : null
}

export async function findScan(scanId: string) {
  const scan = await getScanWithRelations(scanId)
  return scan ? mapScan(scan) : null
}

// Most recent reports for one user, newest first — used to build the report
// detail page's Progress Tracking trend (see lib/reports/report-view-model.ts).
export async function listReportsForUser(userId: string, limit = 6) {
  const reports = await prisma.report.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      findings: { orderBy: { sortOrder: "asc" } },
      recommendations: { orderBy: { rank: "asc" } },
      climateReading: true,
    },
  })

  return reports.map(mapReport)
}

export async function saveReportDownload(input: {
  reportId: string
  format: DomainDownloadFormat
  userId?: string
  userAgent?: string
}) {
  const download = await prisma.reportDownload.create({
    data: {
      reportId: input.reportId,
      format: toPrismaDownloadFormat(input.format),
      userId: input.userId,
      userAgent: input.userAgent,
    },
  })

  return mapDownload(download)
}

export async function listDownloads() {
  const downloads = await prisma.reportDownload.findMany({
    orderBy: { createdAt: "desc" },
  })

  return downloads.map(mapDownload)
}

export async function saveAuditLog(entry: Omit<AuditLogEntry, "id" | "createdAt">) {
  const auditLog = await prisma.auditLog.create({
    data: {
      actorId: entry.actorId === "placeholder-admin" ? undefined : entry.actorId,
      actorRole: entry.actorRole ? toPrismaUserRole(entry.actorRole) : undefined,
      action: entry.action,
      targetType: entry.targetType,
      targetId: entry.targetId,
    },
  })

  return mapAuditLog(auditLog)
}

export async function listAuditLogs() {
  const auditLogs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
    include: { actor: { select: { name: true, email: true } } },
  })

  return auditLogs.map(mapAuditLog)
}

// Real per-user counts for the /account "Your data" summary — scoped to
// one signed-in user's own rows, never a cross-user query.
export async function countScansForUser(userId: string) {
  return prisma.scan.count({ where: { userId } })
}

export async function countReportsForUser(userId: string) {
  return prisma.report.count({ where: { userId } })
}

// Deletes a user's Scan rows and everything that cascades from them
// (Report, ReportFinding, Recommendation, ReportChatMessage,
// ReportDownload, AiProviderEvent) — Scan.user and Report.user are
// SetNull, not Cascade (see prisma/schema.prisma), so these rows would
// otherwise survive as orphans once the User row itself is gone. Mirrors
// the first step of admin-users.ts's deleteUserAccount transaction; this
// version backs the self-service path instead — see lib/auth/auth.ts's
// user.deleteUser.beforeDelete hook, which runs this before better-auth
// deletes the User row (which then cascades everything else: AuthAccount,
// AuthSession, SkinAdviceMessage, DoshaProfile, any remaining
// ReportChatMessage).
export async function deleteAllScansForUser(userId: string) {
  await prisma.scan.deleteMany({ where: { userId } })
}

// Backs the Overview tab's "today's scans" figure — real-time count, not a
// cached/derived value, using the same local-midnight boundary convention
// as lib/backend/skin-advice-store.ts's countSkinAdviceMessagesThisMonth.
export async function countScansToday() {
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  return prisma.scan.count({ where: { createdAt: { gte: startOfToday } } })
}

export async function saveAiProviderEvent(event: Omit<AiProviderEvent, "id" | "createdAt">) {
  const aiEvent = await prisma.aiProviderEvent.create({
    data: {
      provider: event.provider,
      model: event.model,
      status: toPrismaAiProviderStatus(event.status),
      scanId: event.scanId,
      reportId: event.reportId,
      reason: event.reason,
      durationMs: event.durationMs,
    },
  })

  return mapAiProviderEvent(aiEvent)
}

export async function findAiProviderEventForReport(reportId: string) {
  const event = await prisma.aiProviderEvent.findFirst({
    where: { reportId },
    orderBy: { createdAt: "desc" },
  })

  return event ? mapAiProviderEvent(event) : null
}

export async function listAiProviderEvents() {
  const events = await prisma.aiProviderEvent.findMany({
    orderBy: { createdAt: "desc" },
  })

  return events.map(mapAiProviderEvent)
}

// Real day-bucketed scan counts for the analytics "Scans over time" chart —
// one grouped aggregate query in Postgres, not every Scan row loaded into JS.
export async function getScanCountsByDay(since: Date) {
  return prisma.$queryRaw<{ day: Date; count: number }[]>`
    SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::int AS count
    FROM "Scan"
    WHERE "createdAt" >= ${since}
    GROUP BY day
    ORDER BY day ASC
  `
}

// Total ReportFinding rows — the denominator for the "Most common findings"
// list's real percentages (see getTopReportFindings below).
export async function countReportFindings() {
  return prisma.reportFinding.count()
}

// Groups by (label, band) rather than label alone, since the same cosmetic
// label can carry different bands (e.g. "Visible texture" / mild vs
// balanced) and those are meaningfully different findings for this list.
// The number of distinct (label, band) pairs is small and bounded by the
// findings taxonomy, so sorting the grouped rows in JS is cheap — this
// never loads individual ReportFinding rows.
export async function getTopReportFindings(limit: number) {
  const grouped = await prisma.reportFinding.groupBy({
    by: ["label", "band"],
    _count: { _all: true },
  })

  return grouped
    .map((row) => ({ label: row.label, band: row.band, count: row._count._all }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

// Groups by productName (not productId) since anonymous/legacy recommendation
// rows can have a null productId but always carry the name snapshot — see
// mapRecommendation's productSnapshot fallback above for the same reasoning.
export async function getTopRecommendedProducts(limit: number) {
  const grouped = await prisma.recommendation.groupBy({
    by: ["productName"],
    _count: { _all: true },
  })

  return grouped
    .map((row) => ({ name: row.productName, count: row._count._all }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

// Backs the "repeat usage" feature-adoption stat — real count of users with
// more than one Scan row, computed entirely in Postgres (GROUP BY/HAVING)
// rather than pulling every scan into memory to tally per-user counts.
export async function countUsersWithRepeatScans() {
  const rows = await prisma.$queryRaw<{ count: number }[]>`
    SELECT COUNT(*)::int AS count FROM (
      SELECT "userId" FROM "Scan"
      WHERE "userId" IS NOT NULL
      GROUP BY "userId"
      HAVING COUNT(*) > 1
    ) AS repeat_scan_users
  `

  return rows[0]?.count ?? 0
}

// Not a Prisma default (`cuid()`/`uuid()`) because scan-service needs the
// scan and report IDs before either row is created, to cross-link them in
// the same nested write above. Timestamp + random suffix keeps it roughly
// sortable and collision-safe without a DB round-trip.
export function createId(prefix: string) {
  const random = Math.random().toString(36).slice(2, 8)
  return `${prefix}_${Date.now().toString(36)}_${random}`
}

function getReportWithRelations(reportId: string) {
  return prisma.report.findUnique({
    where: { id: reportId },
    include: {
      findings: { orderBy: { sortOrder: "asc" } },
      recommendations: { orderBy: { rank: "asc" } },
      climateReading: true,
    },
  })
}

function getScanWithRelations(scanId: string) {
  return prisma.scan.findUnique({
    where: { id: scanId },
    include: { report: true },
  })
}

// Each active filter (search, aiSource, scanSource, status, dateRange)
// becomes its own clause, ANDed together — so "search X AND status Y" works
// as an intersection, not an OR across filter types (the OR below is only
// within the free-text search across multiple fields).
function buildReportWhere(query: ReportTableQuery): Prisma.ReportWhereInput {
  const filters: Prisma.ReportWhereInput[] = []

  if (query.userId) {
    filters.push({ userId: query.userId })
  }

  if (query.search?.trim()) {
    const search = query.search.trim()
    filters.push({
      OR: [
        { id: { contains: search, mode: "insensitive" } },
        { scanId: { contains: search, mode: "insensitive" } },
        { userId: { contains: search, mode: "insensitive" } },
        { summary: { contains: search, mode: "insensitive" } },
        { model: { contains: search, mode: "insensitive" } },
        { user: { is: { name: { contains: search, mode: "insensitive" } } } },
        { user: { is: { email: { contains: search, mode: "insensitive" } } } },
        {
          recommendations: {
            some: {
              productName: { contains: search, mode: "insensitive" },
            },
          },
        },
      ],
    })
  }

  if (query.aiSource) {
    filters.push({ source: toPrismaReportSource(query.aiSource) })
  }

  if (query.scanSource) {
    filters.push({ scan: { source: toPrismaScanSource(query.scanSource) } })
  }

  if (query.status) {
    filters.push(getReportStatusWhere(query.status))
  }

  const createdAfter = getDateRangeStart(query.dateRange)
  if (createdAfter) {
    filters.push({ createdAt: { gte: createdAfter } })
  }

  return filters.length ? { AND: filters } : {}
}

function getReportOrderBy(sort: ReportTableSort | undefined): Prisma.ReportOrderByWithRelationInput[] {
  if (sort === "oldest") return [{ createdAt: "asc" }]
  if (sort === "reportId") return [{ id: "asc" }]
  if (sort === "status") return [{ scan: { status: "asc" } }, { createdAt: "desc" }]
  if (sort === "aiSource") return [{ source: "asc" }, { createdAt: "desc" }]
  if (sort === "updated") return [{ updatedAt: "desc" }]
  return [{ createdAt: "desc" }]
}

function getDateRangeStart(dateRange: ReportTableQuery["dateRange"]) {
  const now = new Date()

  if (dateRange === "today") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  }

  if (dateRange === "week") {
    const start = new Date(now)
    start.setDate(now.getDate() - 7)
    return start
  }

  if (dateRange === "month") {
    return new Date(now.getFullYear(), now.getMonth(), 1)
  }

  return null
}

// "archived" is a status the admin UI can filter by, but there's no
// archiving feature yet — matching an ID that can never exist makes that
// filter safely return zero rows instead of silently showing everything.
function getReportStatusWhere(status: ReportTableStatus): Prisma.ReportWhereInput {
  if (status === "pending") return { scan: { status: ScanStatus.RECEIVED } }
  if (status === "failed") return { scan: { status: ScanStatus.FAILED } }
  if (status === "archived") return { id: "__archived_reports_not_implemented__" }
  return { scan: { status: { in: [ScanStatus.ANALYZED, ScanStatus.FALLBACK] } } }
}

function getReportTableStatus(status: ScanStatus): ReportTableStatus {
  if (status === ScanStatus.RECEIVED) return "pending"
  if (status === ScanStatus.FAILED) return "failed"
  return "completed"
}

function clampPageSize(pageSize: number) {
  if (pageSize === 50 || pageSize === 100) return pageSize
  return 25
}

export function shortenReportId(reportId: string) {
  return `RPT-${reportId.slice(-5).toUpperCase()}`
}

function mapScan(scan: NonNullable<ScanWithRelations>): StoredScan {
  return {
    id: scan.id,
    userId: scan.userId ?? undefined,
    source: fromPrismaScanSource(scan.source),
    status: fromPrismaScanStatus(scan.status),
    image: {
      fileName: scan.imageFileName ?? undefined,
      mimeType: scan.imageMimeType ?? undefined,
      size: scan.imageSizeBytes ?? undefined,
      width: scan.imageWidth ?? undefined,
      height: scan.imageHeight ?? undefined,
      stored: scan.originalImageStored,
    },
    quality: {
      lighting: scan.qualityLighting ?? "not_visible",
      framing: scan.qualityFraming ?? "unclear",
      confidence: scan.qualityConfidence ?? "low",
    },
    userAgent: scan.userAgent ?? undefined,
    createdAt: scan.createdAt.toISOString(),
    updatedAt: scan.updatedAt.toISOString(),
  }
}

function mapReport(report: NonNullable<ReportWithRelations>): StoredReport {
  const recommendations = report.recommendations.map(mapRecommendation)

  return {
    id: report.id,
    scanId: report.scanId,
    userId: report.userId ?? undefined,
    analysis: {
      summary: report.summary,
      cosmeticFindings: report.findings.map((finding) => ({
        label: finding.label,
        concern: finding.concern ?? undefined,
        band: finding.band,
        observation: finding.observation,
      })),
      recommendations: recommendations.map((recommendation) => ({
        title: recommendation.product.name,
        reason: recommendation.reasons.join(" "),
        category: recommendation.product.category,
        imagePath: recommendation.product.imagePath,
      })),
      routineTips: getStringArray(report.routineTips),
      // NOTE: saveReportBundle above writes qualityLighting/qualityFraming/
      // qualityConfidence onto the Scan row, but this read path doesn't
      // pull them back from `report.scan` — it always reports the lowest-
      // confidence placeholder values here regardless of what was actually
      // stored. Worth checking whether that's intentional (e.g. quality is
      // meant to be a write-once/display-once value from the original
      // analyze response) or a gap in this mapping.
      quality: {
        lighting: "not_visible",
        framing: "unclear",
        confidence: "low",
      },
      disclaimer: report.disclaimer,
      source: fromPrismaReportSource(report.source),
      model: report.model,
    },
    recommendations,
    fallbackReason: report.fallbackReason ?? undefined,
    climate: report.climateReading
      ? {
          temperatureC: report.climateReading.temperatureC,
          humidityPercent: report.climateReading.humidityPercent,
          uvIndex: report.climateReading.uvIndex,
        }
      : undefined,
    createdAt: report.createdAt.toISOString(),
    updatedAt: report.updatedAt.toISOString(),
  }
}

function mapRecommendation(
  recommendation: NonNullable<ReportWithRelations>["recommendations"][number],
): RecommendationMatch {
  return {
    product: getProductSnapshot(recommendation.productSnapshot, recommendation),
    score: recommendation.score,
    rank: recommendation.rank,
    matchStrength: fromPrismaMatchStrength(recommendation.matchStrength),
    reasons: getStringArray(recommendation.reasons),
    routineStep: fromPrismaRoutineStep(recommendation.routineStep),
  }
}

// Prefers the stored JSON snapshot (full product as it was at
// recommendation time); falls back to reconstructing a minimal product from
// the individual columns only if the snapshot is missing or malformed —
// covers rows written before productSnapshot existed, or any hand-edited data.
function getProductSnapshot(
  value: Prisma.JsonValue,
  recommendation: NonNullable<ReportWithRelations>["recommendations"][number],
): AuroraProduct {
  if (isAuroraProduct(value)) return value

  return {
    id: recommendation.productSlug,
    name: recommendation.productName,
    category: recommendation.productCategory,
    routineStep: fromPrismaRoutineStep(recommendation.routineStep),
    shortDescription: recommendation.shortDescription,
    imagePath: recommendation.productSnapshot && isProductSnapshotRecord(recommendation.productSnapshot)
      ? getOptionalString(recommendation.productSnapshot.imagePath)
      : undefined,
    cosmeticBenefits: getStringArray(recommendation.cosmeticBenefits),
    bestFor: [],
    priority: recommendation.score,
  }
}

function mapDownload(download: {
  id: string
  reportId: string
  format: DownloadFormat
  userId: string | null
  userAgent: string | null
  createdAt: Date
}): ReportDownload {
  return {
    id: download.id,
    reportId: download.reportId,
    format: fromPrismaDownloadFormat(download.format),
    userId: download.userId ?? undefined,
    userAgent: download.userAgent ?? undefined,
    createdAt: download.createdAt.toISOString(),
  }
}

function mapAuditLog(auditLog: {
  id: string
  actorId: string | null
  actorRole: UserRole | null
  action: string
  targetType: string
  targetId: string
  createdAt: Date
  actor?: { name: string | null; email: string } | null
}): AuditLogEntry {
  return {
    id: auditLog.id,
    actorId: auditLog.actorId ?? undefined,
    actorName: auditLog.actor?.name ?? undefined,
    actorEmail: auditLog.actor?.email ?? undefined,
    actorRole: auditLog.actorRole ? fromPrismaUserRole(auditLog.actorRole) : undefined,
    action: auditLog.action,
    targetType: auditLog.targetType === "scan" || auditLog.targetType === "report" || auditLog.targetType === "download" ? auditLog.targetType : "admin",
    targetId: auditLog.targetId,
    createdAt: auditLog.createdAt.toISOString(),
  }
}

function mapAiProviderEvent(event: {
  id: string
  provider: string
  model: string
  status: AiProviderStatus
  scanId: string | null
  reportId: string | null
  reason: string | null
  durationMs: number | null
  createdAt: Date
}): AiProviderEvent {
  return {
    id: event.id,
    provider: event.provider,
    model: event.model,
    status: fromPrismaAiProviderStatus(event.status),
    scanId: event.scanId ?? undefined,
    reportId: event.reportId ?? undefined,
    reason: event.reason ?? undefined,
    durationMs: event.durationMs ?? undefined,
    createdAt: event.createdAt.toISOString(),
  }
}

function toPrismaScanSource(source: StoredScan["source"]) {
  if (source === "camera") return ScanSource.CAMERA
  if (source === "upload") return ScanSource.UPLOAD
  return ScanSource.UNKNOWN
}

function fromPrismaScanSource(source: ScanSource): StoredScan["source"] {
  if (source === ScanSource.CAMERA) return "camera"
  if (source === ScanSource.UPLOAD) return "upload"
  return "unknown"
}

function toPrismaScanStatus(status: StoredScan["status"]) {
  if (status === "analyzed") return ScanStatus.ANALYZED
  if (status === "fallback") return ScanStatus.FALLBACK
  if (status === "failed") return ScanStatus.FAILED
  return ScanStatus.RECEIVED
}

function fromPrismaScanStatus(status: ScanStatus): StoredScan["status"] {
  if (status === ScanStatus.ANALYZED) return "analyzed"
  if (status === ScanStatus.FALLBACK) return "fallback"
  if (status === ScanStatus.FAILED) return "failed"
  return "received"
}

function toPrismaReportSource(source: StoredReport["analysis"]["source"]) {
  if (source === "gemini") return ReportSource.GEMINI
  return ReportSource.FALLBACK
}

function fromPrismaReportSource(source: ReportSource): StoredReport["analysis"]["source"] {
  if (source === ReportSource.GEMINI) return "gemini"
  return "fallback"
}

function toPrismaRoutineStep(step: RecommendationMatch["routineStep"]) {
  if (step === "cleanse") return RoutineStep.CLEANSE
  if (step === "moisturize") return RoutineStep.MOISTURIZE
  if (step === "protect") return RoutineStep.PROTECT
  return RoutineStep.TREAT
}

function fromPrismaRoutineStep(step: RoutineStep): RecommendationMatch["routineStep"] {
  if (step === RoutineStep.CLEANSE) return "cleanse"
  if (step === RoutineStep.MOISTURIZE) return "moisturize"
  if (step === RoutineStep.PROTECT) return "protect"
  return "treat"
}

function toPrismaMatchStrength(strength: RecommendationMatch["matchStrength"]) {
  if (strength === "primary") return MatchStrength.PRIMARY
  if (strength === "supporting") return MatchStrength.SUPPORTING
  return MatchStrength.OPTIONAL
}

function fromPrismaMatchStrength(strength: MatchStrength): RecommendationMatch["matchStrength"] {
  if (strength === MatchStrength.PRIMARY) return "primary"
  if (strength === MatchStrength.SUPPORTING) return "supporting"
  return "optional"
}

function toPrismaDownloadFormat(format: DomainDownloadFormat) {
  if (format === "pdf") return DownloadFormat.PDF
  return DownloadFormat.PRINT_HTML
}

function fromPrismaDownloadFormat(format: DownloadFormat): DomainDownloadFormat {
  if (format === DownloadFormat.PDF) return "pdf"
  return "print-html"
}

// Lossy on purpose in one direction: the domain has an "operations"
// AdminRole (lib/backend/types.ts), but the Prisma UserRole enum has no
// OPERATIONS value (see the matching note in lib/auth/admin.ts), so it
// collapses into ADMIN here. The reverse mapping below has no way back to
// "operations" — round-tripping an audit log entry logged as "operations"
// will read back as "admin".
function toPrismaUserRole(role: NonNullable<AuditLogEntry["actorRole"]>) {
  if (role === "owner") return UserRole.OWNER
  if (role === "operations") return UserRole.ADMIN
  if (role === "support") return UserRole.SUPPORT
  if (role === "privacy") return UserRole.PRIVACY
  return UserRole.ADMIN
}

function fromPrismaUserRole(role: UserRole): NonNullable<AuditLogEntry["actorRole"]> {
  if (role === UserRole.OWNER) return "owner"
  if (role === UserRole.SUPPORT) return "support"
  if (role === UserRole.PRIVACY) return "privacy"
  if (role === UserRole.ADMIN) return "admin"
  return "support"
}

function toPrismaAiProviderStatus(status: AiProviderEvent["status"]) {
  if (status === "success") return AiProviderStatus.SUCCESS
  if (status === "failed") return AiProviderStatus.FAILED
  return AiProviderStatus.FALLBACK
}

function fromPrismaAiProviderStatus(status: AiProviderStatus): AiProviderEvent["status"] {
  if (status === AiProviderStatus.SUCCESS) return "success"
  if (status === AiProviderStatus.FAILED) return "failed"
  return "fallback"
}

function getStringArray(value: Prisma.JsonValue) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []
}

function isAuroraProduct(value: Prisma.JsonValue): value is AuroraProduct {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false
  const product = value as Record<string, unknown>
  return (
    typeof product.id === "string" &&
    typeof product.name === "string" &&
    typeof product.category === "string" &&
    typeof product.routineStep === "string" &&
    typeof product.shortDescription === "string" &&
    Array.isArray(product.cosmeticBenefits) &&
    Array.isArray(product.bestFor) &&
    typeof product.priority === "number"
  )
}

function isProductSnapshotRecord(value: Prisma.JsonValue): value is Record<string, Prisma.JsonValue> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function getOptionalString(value: Prisma.JsonValue | undefined) {
  return typeof value === "string" ? value : undefined
}
