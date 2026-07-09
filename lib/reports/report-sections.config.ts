// Ordered, enable/disable-able registry of report sections — the "future-
// ready" requirement from the spec, satisfied as a small ordered list rather
// than a full plugin system. Adding a future module (Wrinkle Analysis, UV
// Damage, etc.) later means appending one entry here; the web page and PDF
// route both just render whatever this array says, in this order.
import type { ComponentType } from "react"

import { AnalysisVisualization } from "@/components/report/sections/analysis-visualization"
import { ConfidenceDonut } from "@/components/report/sections/confidence-donut"
import { CoverHeader } from "@/components/report/sections/cover-header"
import { Disclaimer } from "@/components/report/sections/disclaimer"
import { ExecutiveSummaryCards } from "@/components/report/sections/executive-summary-cards"
import { KeyFindingsTable } from "@/components/report/sections/key-findings-table"
import { ProgressTracking } from "@/components/report/sections/progress-tracking"
import { RecommendedProducts } from "@/components/report/sections/recommended-products"
import { SkinAssessmentTable } from "@/components/report/sections/skin-assessment-table"
import { SkinMetrics } from "@/components/report/sections/skin-metrics"
import { TechnicalDetails } from "@/components/report/sections/technical-details"
import type { ReportViewModel } from "@/lib/reports/report-view-model"

export type ReportSectionDefinition = {
  id: string
  title: string
  component: ComponentType<{ vm: ReportViewModel }>
  isEnabled: (vm: ReportViewModel) => boolean
  /** Cover renders its own full-width band outside the section grid. */
  fullWidth?: boolean
}

export const REPORT_SECTIONS: ReportSectionDefinition[] = [
  { id: "cover", title: "Cover", component: CoverHeader, isEnabled: () => true, fullWidth: true },
  {
    id: "executive-summary",
    title: "Executive Summary",
    component: ExecutiveSummaryCards,
    isEnabled: () => true,
    fullWidth: true,
  },
  {
    id: "skin-assessment",
    title: "Skin Assessment Overview",
    component: SkinAssessmentTable,
    isEnabled: () => true,
    fullWidth: true,
  },
  {
    id: "analysis-visualization",
    title: "Analysis Visualization",
    component: AnalysisVisualization,
    isEnabled: () => true,
    fullWidth: true,
  },
  {
    id: "skin-metrics",
    title: "Skin Metrics",
    component: SkinMetrics,
    isEnabled: (vm) => vm.metrics.length > 0,
    fullWidth: true,
  },
  {
    id: "key-findings",
    title: "Key Findings",
    component: KeyFindingsTable,
    isEnabled: (vm) => vm.findingsRows.length > 0,
    fullWidth: true,
  },
  {
    id: "confidence-breakdown",
    title: "AI Confidence Breakdown",
    component: ConfidenceDonut,
    isEnabled: () => true,
    fullWidth: true,
  },
  {
    id: "recommended-products",
    title: "Recommended AURA Products",
    component: RecommendedProducts,
    isEnabled: () => true,
    fullWidth: true,
  },
  {
    id: "technical-details",
    title: "Technical Details",
    component: TechnicalDetails,
    isEnabled: () => true,
    fullWidth: true,
  },
  {
    id: "progress-tracking",
    title: "Progress Tracking",
    component: ProgressTracking,
    isEnabled: (vm) => vm.progressTracking !== null,
    fullWidth: true,
  },
  { id: "disclaimer", title: "Disclaimer", component: Disclaimer, isEnabled: () => true, fullWidth: true },
]
