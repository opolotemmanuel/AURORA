// Turns the Prisma-backed report/scan/user/prior-reports rows into every
// display-ready field the report sections need. Both the web report page
// (app/(dashboard)/reports/[reportId]/page.tsx) and the PDF pipeline
// (lib/reports/pdf/render-report-pdf.ts) render off this same shape, so
// there is exactly one place that decides what a report "means" visually.
import { FINDING_CONCERN_MAP } from "@/lib/backend/scan-service"
import type { AiProviderEvent, ReportFinding, StoredReport, StoredScan } from "@/lib/backend/types"
import { interpretClimate } from "@/lib/climate/interpret"
import type { StoredDoshaProfile } from "@/lib/dosha/dosha-store"
import type { Dosha } from "@/lib/dosha/questions"
import {
  getBandVisual,
  getConfidenceVisual,
  getPriorityBadgeVariant,
  getPriorityLabel,
  worstBandVisual,
  type BadgeVariant,
  type PriorityTier,
} from "@/lib/reports/band-visuals"
import { computeComfortScore, getComfortBand, type ComfortBand } from "@/lib/reports/comfort-score"
import type { RecommendationMatch } from "@/lib/recommendations/types"

const REPORT_TEMPLATE_VERSION = "v1.0"

// The spec's Skin Metrics list includes "Elasticity," which has no
// corresponding concept anywhere in this app's AI adapter or recommendation
// engine (lib/recommendations/types.ts's SkinConcern union). Rather than
// invent a reading for a dimension that was never assessed, that metric is
// simply omitted whenever the AI didn't report it — see METRIC_CONCERNS.
const METRIC_CONCERNS: Array<{ concern: string; label: string }> = [
  { concern: "hydration", label: "Hydration" },
  { concern: "oilBalance", label: "Oil Balance" },
  { concern: "texture", label: "Texture" },
  { concern: "pigmentationAppearance", label: "Pigmentation" },
  { concern: "rednessAppearance", label: "Redness" },
]

export type ReportViewModel = {
  reportId: string
  reportShortId: string
  createdAt: Date
  owner: { name: string; email?: string; userId?: string }
  // Follow-up chat requires a real report owner to attach messages to — an
  // anonymous scan (no userId) never gets a chat button, regardless of
  // viewer. Whoever already passed the ownership-or-admin gate to load this
  // view-model at all may chat, same as they may view the report itself.
  chatEnabled: boolean
  executiveSummary: {
    overallLabel: string
    overallBadgeVariant: BadgeVariant
    confidenceLabel: string
    confidenceBadgeVariant: BadgeVariant
    riskLabel: string
    riskBadgeVariant: BadgeVariant
    scanDateLabel: string
  }
  assessmentRows: Array<{
    area: string
    statusLabel: string
    statusBadgeVariant: BadgeVariant
    fillRatio: number
    priorityLabel: string
    priorityBadgeVariant: BadgeVariant
  }>
  metrics: Array<{ label: string; fillRatio: number; tierLabel: string }>
  findingsRows: Array<{
    priorityLabel: string
    priorityBadgeVariant: BadgeVariant
    finding: string
    observation: string
    impact: string
    recommendation: string
  }>
  confidenceBreakdown: {
    overallLabel: string
    overallFillRatio: number
    items: Array<{ label: string; visualLabel: string; fillRatio: number; badgeVariant: BadgeVariant }>
  }
  recommendations: RecommendationMatch[]
  technicalDetails: {
    modelVersion: string
    analysisEngine: string
    processingTime: string
    imageResolution: string
    device: string
    scanTimestamp: string
    reportVersion: string
  }
  progressTracking: {
    points: Array<{ dateLabel: string; fillRatio: number; tierLabel: string; isCurrent: boolean }>
    improved: boolean
  } | null
  // Null whenever no ClimateReading exists for this report (predates this
  // feature, or the scan's Open-Meteo call failed) — the Climate Conditions
  // section (components/report/sections/climate-conditions.tsx) simply
  // doesn't render in that case, no broken/empty state.
  climate: {
    temperatureC: number
    humidityPercent: number
    uvIndex: number
    interpretiveSentences: string[]
    comfortBand: ComfortBand
  } | null
  // Null whenever the report owner has never completed the dosha
  // questionnaire (it's opt-in, see dosha-assessment/page.tsx) or the report
  // has no owner (anonymous scan) — the Dosha section simply doesn't render
  // in that case, same graceful-omission pattern as `climate` above.
  dosha: {
    primaryDosha: Dosha
    secondaryDosha: Dosha | null
    breakdown: Record<Dosha, number>
  } | null
}

export function buildReportViewModel(input: {
  report: StoredReport
  scan: StoredScan
  owner: { name?: string; email?: string; id: string } | null
  aiEvent: AiProviderEvent | null
  priorReports: StoredReport[]
  doshaProfile: StoredDoshaProfile | null
}): ReportViewModel {
  const { report, scan, owner, aiEvent, priorReports, doshaProfile } = input
  const findings = report.analysis.cosmeticFindings
  const overall = worstBandVisual(findings)
  const confidence = getConfidenceVisual(scan.quality.confidence)
  const createdAt = new Date(report.createdAt)

  return {
    reportId: report.id,
    reportShortId: shortenReportId(report.id),
    createdAt,
    owner: {
      name: owner?.name?.trim() || "Aurora Organics user",
      email: owner?.email,
      userId: owner?.id,
    },
    chatEnabled: Boolean(report.userId),
    executiveSummary: {
      overallLabel: overall.wellnessLabel,
      overallBadgeVariant: overall.badgeVariant,
      confidenceLabel: confidence.label,
      confidenceBadgeVariant: confidence.badgeVariant,
      riskLabel: getPriorityLabel(overall.priority),
      riskBadgeVariant: getPriorityBadgeVariant(overall.priority),
      scanDateLabel: formatDate(createdAt),
    },
    assessmentRows: buildAssessmentRows(findings),
    metrics: buildMetrics(findings),
    findingsRows: buildFindingsRows(findings),
    confidenceBreakdown: buildConfidenceBreakdown(scan),
    recommendations: report.recommendations,
    technicalDetails: {
      modelVersion: report.analysis.model,
      analysisEngine: report.analysis.source === "gemini" ? "Google Gemini (vision)" : "Rule-based fallback",
      processingTime: aiEvent?.durationMs ? formatDuration(aiEvent.durationMs) : "Not available",
      imageResolution:
        scan.image.width && scan.image.height ? `${scan.image.width} × ${scan.image.height}` : "Not available",
      device: classifyDevice(scan.userAgent),
      scanTimestamp: formatDateTime(new Date(scan.createdAt)),
      reportVersion: REPORT_TEMPLATE_VERSION,
    },
    progressTracking: buildProgressTracking(report, priorReports),
    climate: buildClimate(report),
    dosha: doshaProfile
      ? {
          primaryDosha: doshaProfile.primaryDosha,
          secondaryDosha: doshaProfile.secondaryDosha,
          breakdown: doshaProfile.breakdown,
        }
      : null,
  }
}

function buildClimate(report: StoredReport): ReportViewModel["climate"] {
  if (!report.climate) return null

  const findings = report.analysis.cosmeticFindings
  const score = computeComfortScore(report.climate, findings)

  return {
    temperatureC: report.climate.temperatureC,
    humidityPercent: report.climate.humidityPercent,
    uvIndex: report.climate.uvIndex,
    interpretiveSentences: interpretClimate(report.climate),
    comfortBand: getComfortBand(score),
  }
}

function buildAssessmentRows(findings: ReportFinding[]): ReportViewModel["assessmentRows"] {
  const overall = worstBandVisual(findings)
  const rows: ReportViewModel["assessmentRows"] = [
    {
      area: "Overall Skin Health",
      statusLabel: overall.wellnessLabel,
      statusBadgeVariant: overall.badgeVariant,
      fillRatio: overall.fillRatio,
      priorityLabel: getPriorityLabel(overall.priority),
      priorityBadgeVariant: getPriorityBadgeVariant(overall.priority),
    },
  ]

  for (const finding of findings) {
    const visual = getBandVisual(finding.band)
    rows.push({
      area: finding.label,
      statusLabel: visual.label,
      statusBadgeVariant: visual.badgeVariant,
      fillRatio: visual.fillRatio,
      priorityLabel: getPriorityLabel(visual.priority),
      priorityBadgeVariant: getPriorityBadgeVariant(visual.priority),
    })
  }

  return rows
}

function buildMetrics(findings: ReportFinding[]): ReportViewModel["metrics"] {
  const bandByConcern = new Map<string, string>()
  for (const finding of findings) {
    const concern = FINDING_CONCERN_MAP[finding.label.toLowerCase()]
    if (concern) bandByConcern.set(concern, finding.band)
  }

  return METRIC_CONCERNS.filter((metric) => bandByConcern.has(metric.concern)).map((metric) => {
    const visual = getBandVisual(bandByConcern.get(metric.concern)!)
    return { label: metric.label, fillRatio: visual.fillRatio, tierLabel: visual.wellnessLabel }
  })
}

function buildFindingsRows(findings: ReportFinding[]): ReportViewModel["findingsRows"] {
  return findings.map((finding) => {
    const visual = getBandVisual(finding.band)
    return {
      priorityLabel: getPriorityLabel(visual.priority),
      priorityBadgeVariant: getPriorityBadgeVariant(visual.priority),
      finding: finding.label,
      observation: finding.observation,
      impact: `${visual.wellnessLabel === "Needs attention" ? "Requires attention" : `${visual.label} impact`}`,
      recommendation: genericRecommendation(visual.priority),
    }
  })
}

function genericRecommendation(priority: PriorityTier): string {
  if (priority === "high") return "Prioritize adjusting your routine to address this concern."
  if (priority === "medium") return "Consider a targeted product for this concern."
  return "Continue your current routine and monitor over time."
}

// Real signals available today: `quality.framing` (clear/usable/unclear —
// closest proxy for "was a face detected & positioned") and
// `quality.lighting`/`quality.confidence` (coarse bands). There's no
// distinct "image quality" signal separate from lighting, so it reuses the
// lighting band rather than inventing a fifth, fabricated number.
function buildConfidenceBreakdown(scan: StoredScan): ReportViewModel["confidenceBreakdown"] {
  const confidence = getConfidenceVisual(scan.quality.confidence)
  const lighting = getBandVisual(scan.quality.lighting)
  const framing = getFramingVisual(scan.quality.framing)

  return {
    overallLabel: confidence.label,
    overallFillRatio: confidence.fillRatio,
    items: [
      { label: "Face Detection", visualLabel: framing.label, fillRatio: framing.fillRatio, badgeVariant: framing.badgeVariant },
      { label: "Lighting Quality", visualLabel: lighting.wellnessLabel, fillRatio: lighting.fillRatio, badgeVariant: lighting.badgeVariant },
      { label: "Image Quality", visualLabel: lighting.wellnessLabel, fillRatio: lighting.fillRatio, badgeVariant: lighting.badgeVariant },
      { label: "Model Confidence", visualLabel: confidence.label, fillRatio: confidence.fillRatio, badgeVariant: confidence.badgeVariant },
    ],
  }
}

function getFramingVisual(framing: string) {
  if (framing === "clear") return { label: "High confidence", fillRatio: 0.92, badgeVariant: "secondary" as const }
  if (framing === "usable") return { label: "Medium confidence", fillRatio: 0.6, badgeVariant: "default" as const }
  return { label: "Low confidence", fillRatio: 0.3, badgeVariant: "destructive" as const }
}

function buildProgressTracking(
  current: StoredReport,
  priorReports: StoredReport[],
): ReportViewModel["progressTracking"] {
  if (priorReports.length === 0) return null

  const ordered = [...priorReports].reverse() // oldest -> newest
  const points = ordered.map((report) => {
    const visual = worstBandVisual(report.analysis.cosmeticFindings)
    return {
      dateLabel: formatDate(new Date(report.createdAt)),
      fillRatio: visual.fillRatio,
      tierLabel: visual.wellnessLabel,
      isCurrent: false,
    }
  })

  const currentVisual = worstBandVisual(current.analysis.cosmeticFindings)
  points.push({
    dateLabel: formatDate(new Date(current.createdAt)),
    fillRatio: currentVisual.fillRatio,
    tierLabel: currentVisual.wellnessLabel,
    isCurrent: true,
  })

  const previousFill = points[points.length - 2]?.fillRatio ?? currentVisual.fillRatio
  return { points, improved: currentVisual.fillRatio >= previousFill }
}

// Best-effort classification from the User-Agent string — no parsing
// library is installed for this, and a "Device" technical-details field
// doesn't warrant adding one.
function classifyDevice(userAgent: string | undefined): string {
  if (!userAgent) return "Not available"

  if (/iphone/i.test(userAgent)) return "iPhone (mobile web)"
  if (/ipad/i.test(userAgent)) return "iPad (mobile web)"
  if (/android/i.test(userAgent)) return "Android (mobile web)"
  if (/macintosh/i.test(userAgent)) return "Mac (desktop web)"
  if (/windows/i.test(userAgent)) return "Windows (desktop web)"
  if (/linux/i.test(userAgent)) return "Linux (desktop web)"
  return "Desktop web"
}

function formatDuration(durationMs: number): string {
  return durationMs < 1000 ? `${durationMs}ms` : `${(durationMs / 1000).toFixed(1)}s`
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })
}

function formatDateTime(date: Date): string {
  return date.toLocaleString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function shortenReportId(reportId: string): string {
  return `RPT-${reportId.slice(-5).toUpperCase()}`
}
