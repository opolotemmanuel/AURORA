// Ordered, enable/disable-able registry of report sections — the "future-
// ready" requirement from the spec, satisfied as a small ordered list rather
// than a full plugin system. Adding a future module (Wrinkle Analysis, UV
// Damage, etc.) later means appending one entry here; the web page and PDF
// route both just render whatever this array says, in this order.
import type { ComponentType } from "react"

import { ClimateConditions } from "@/components/report/sections/climate-conditions"
import { ConfidenceDonut } from "@/components/report/sections/confidence-donut"
import { CoverHeader } from "@/components/report/sections/cover-header"
import { Disclaimer } from "@/components/report/sections/disclaimer"
import { DoshaSection } from "@/components/report/sections/dosha-section"
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
    // Placed after the AI assessment sections (executive summary → skin
    // assessment → metrics → key findings → confidence breakdown) and right
    // before product recommendations, since scan-service.ts already factors
    // a signed-in user's dosha into those recommendations — this section
    // gives the reader the traditional-wellness context behind them. Gated
    // on vm.dosha, which load-report-view-model.ts only populates when the
    // report owner has completed the (opt-in) questionnaire.
    id: "dosha",
    title: "Dosha",
    component: DoshaSection,
    isEnabled: (vm) => vm.dosha !== null,
    fullWidth: true,
  },
  {
    id: "recommended-products",
    title: "Recommended Aurora Organics Products",
    component: RecommendedProducts,
    isEnabled: () => true,
    fullWidth: true,
  },
  {
    id: "climate-conditions",
    title: "Climate Conditions",
    component: ClimateConditions,
    isEnabled: (vm) => vm.climate !== null,
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
