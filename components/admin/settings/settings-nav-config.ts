// Shared tab/category metadata for the Enterprise Settings console's
// 3-column shell (settings-shell.tsx) — no JSX here so both the desktop
// rail+list and the mobile Sheet drawer render from one source instead of
// two lists that could drift apart. Purely a navigation/labeling
// restructure of the same 14 tabs settings-tabs.tsx already defined
// (4 real, 10 honest "not yet available" placeholders) — no tab was
// added, removed, or reworded.
import type { ComponentType } from "react"
import {
  IconActivity,
  IconAdjustments,
  IconBellRinging,
  IconBuildingStore,
  IconChartBar,
  IconCloudRain,
  IconCloudUpload,
  IconDatabaseExport,
  IconFileTypePdf,
  IconFlag,
  IconHistory,
  IconLayoutDashboard,
  IconPlug,
  IconServer,
  IconSettings,
  IconShieldLock,
  IconSparkles,
} from "@tabler/icons-react"

export type SettingsCategoryId = "operations" | "infrastructure" | "configuration"

export type SettingsTabMeta = {
  id: string
  label: string
  icon: ComponentType<{ className?: string }>
  category: SettingsCategoryId
} & (
  | { isReal: true }
  | { isReal: false; title: string; description: string }
)

export const SETTINGS_CATEGORIES: Array<{ id: SettingsCategoryId; label: string; icon: ComponentType<{ className?: string }> }> = [
  { id: "operations", label: "Operations", icon: IconLayoutDashboard },
  { id: "infrastructure", label: "Infrastructure", icon: IconServer },
  { id: "configuration", label: "Configuration", icon: IconSettings },
]

export const SETTINGS_TABS: SettingsTabMeta[] = [
  { id: "overview", label: "Overview", icon: IconChartBar, category: "operations", isReal: true },
  { id: "products", label: "Products", icon: IconBuildingStore, category: "operations", isReal: true },
  { id: "audit-logs", label: "Audit Logs", icon: IconHistory, category: "operations", isReal: true },
  { id: "ai-services", label: "AI Services", icon: IconSparkles, category: "operations", isReal: true },
  {
    id: "backup",
    label: "Backup",
    icon: IconDatabaseExport,
    category: "infrastructure",
    isReal: false,
    title: "Backup & restore",
    description: "Scheduled database backups and restore points. Not yet configurable — no backup schedule or storage target is wired up.",
  },
  {
    id: "monitoring",
    label: "Monitoring",
    icon: IconActivity,
    category: "infrastructure",
    isReal: false,
    title: "Monitoring",
    description: "Uptime and error-rate monitoring dashboards. Not yet available — no monitoring provider is integrated.",
  },
  {
    id: "storage",
    label: "Storage",
    icon: IconCloudUpload,
    category: "infrastructure",
    isReal: false,
    title: "File storage",
    description: "S3/R2-compatible object storage configuration for scan images and assets. Planned but not implemented yet (see AGENTS.md Planned Stack).",
  },
  {
    id: "feature-flags",
    label: "Feature Flags",
    icon: IconFlag,
    category: "configuration",
    isReal: false,
    title: "Feature flags",
    description: "Per-tenant feature toggles for staged rollouts. Not yet available — no flag system exists in the codebase.",
  },
  {
    id: "security",
    label: "Security",
    icon: IconShieldLock,
    category: "configuration",
    isReal: false,
    title: "Security toggles",
    description: "Admin-configurable security policies such as session limits, IP allowlists, and MFA enforcement. Not yet implemented.",
  },
  {
    id: "integrations",
    label: "Integrations",
    icon: IconPlug,
    category: "configuration",
    isReal: false,
    title: "Integrations",
    description: "Third-party integrations such as CRM, marketing, or support tools. Not yet available — no integration framework exists.",
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: IconBellRinging,
    category: "configuration",
    isReal: false,
    title: "Notifications",
    description: "Email/SMS notification preferences and delivery logs. Not yet available — no notification system is wired up.",
  },
  {
    id: "climate-config",
    label: "Climate Config",
    icon: IconCloudRain,
    category: "configuration",
    isReal: false,
    title: "Climate configuration",
    description: "Admin controls for the weather-data provider and climate scoring weights. Open-Meteo is currently fixed in code, not admin-configurable.",
  },
  {
    id: "advanced",
    label: "Advanced",
    icon: IconAdjustments,
    category: "configuration",
    isReal: false,
    title: "Advanced",
    description: "Low-level platform tuning such as caching and rate limits. Not yet available.",
  },
  {
    id: "reports-pdf",
    label: "Reports/PDF Config",
    icon: IconFileTypePdf,
    category: "configuration",
    isReal: false,
    title: "Reports & PDF configuration",
    description: "PDF template and branding configuration for downloadable reports. Not yet available — binary PDF generation itself is not implemented yet (see AGENTS.md Planned Stack).",
  },
]

export const DEFAULT_SETTINGS_TAB = "overview"
export const DEFAULT_SETTINGS_CATEGORY: SettingsCategoryId = "operations"
