"use client"

// Tab shell for the Enterprise Settings console. The 4 real tabs receive
// server-rendered content as children (data fetched in
// app/(dashboard)/settings/page.tsx); every other proposed section renders
// the same honest "not yet available" state — never a blank tab, never a
// fake control.
import {
  IconActivity,
  IconAdjustments,
  IconBellRinging,
  IconChartBar,
  IconCloudRain,
  IconCloudUpload,
  IconDatabaseExport,
  IconFileTypePdf,
  IconFlag,
  IconHistory,
  IconPlug,
  IconShieldLock,
  IconSparkles,
  IconBuildingStore,
} from "@tabler/icons-react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { NotAvailablePanel } from "@/components/admin/settings/not-available-panel"

const NOT_AVAILABLE_TABS = [
  {
    id: "backup",
    label: "Backup",
    icon: IconDatabaseExport,
    title: "Backup & restore",
    description: "Scheduled database backups and restore points. Not yet configurable — no backup schedule or storage target is wired up.",
  },
  {
    id: "monitoring",
    label: "Monitoring",
    icon: IconActivity,
    title: "Monitoring",
    description: "Uptime and error-rate monitoring dashboards. Not yet available — no monitoring provider is integrated.",
  },
  {
    id: "feature-flags",
    label: "Feature Flags",
    icon: IconFlag,
    title: "Feature flags",
    description: "Per-tenant feature toggles for staged rollouts. Not yet available — no flag system exists in the codebase.",
  },
  {
    id: "security",
    label: "Security",
    icon: IconShieldLock,
    title: "Security toggles",
    description: "Admin-configurable security policies such as session limits, IP allowlists, and MFA enforcement. Not yet implemented.",
  },
  {
    id: "integrations",
    label: "Integrations",
    icon: IconPlug,
    title: "Integrations",
    description: "Third-party integrations such as CRM, marketing, or support tools. Not yet available — no integration framework exists.",
  },
  {
    id: "storage",
    label: "Storage",
    icon: IconCloudUpload,
    title: "File storage",
    description: "S3/R2-compatible object storage configuration for scan images and assets. Planned but not implemented yet (see AGENTS.md Planned Stack).",
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: IconBellRinging,
    title: "Notifications",
    description: "Email/SMS notification preferences and delivery logs. Not yet available — no notification system is wired up.",
  },
  {
    id: "climate-config",
    label: "Climate Config",
    icon: IconCloudRain,
    title: "Climate configuration",
    description: "Admin controls for the weather-data provider and climate scoring weights. Open-Meteo is currently fixed in code, not admin-configurable.",
  },
  {
    id: "advanced",
    label: "Advanced",
    icon: IconAdjustments,
    title: "Advanced",
    description: "Low-level platform tuning such as caching and rate limits. Not yet available.",
  },
  {
    id: "reports-pdf",
    label: "Reports/PDF Config",
    icon: IconFileTypePdf,
    title: "Reports & PDF configuration",
    description: "PDF template and branding configuration for downloadable reports. Not yet available — binary PDF generation itself is not implemented yet (see AGENTS.md Planned Stack).",
  },
] as const

export function SettingsTabs({
  overview,
  products,
  auditLogs,
  aiServices,
}: {
  overview: React.ReactNode
  products: React.ReactNode
  auditLogs: React.ReactNode
  aiServices: React.ReactNode
}) {
  return (
    <Tabs defaultValue="overview">
      <TabsList
        variant="line"
        className="sticky top-0 z-20 h-auto w-full flex-wrap justify-start gap-x-1 gap-y-1 border-b border-border bg-background/95 py-1 backdrop-blur supports-backdrop-filter:bg-background/80"
      >
        <TabsTrigger value="overview">
          <IconChartBar className="size-4" />
          Overview
        </TabsTrigger>
        <TabsTrigger value="products">
          <IconBuildingStore className="size-4" />
          Products
        </TabsTrigger>
        <TabsTrigger value="audit-logs">
          <IconHistory className="size-4" />
          Audit Logs
        </TabsTrigger>
        <TabsTrigger value="ai-services">
          <IconSparkles className="size-4" />
          AI Services
        </TabsTrigger>
        {NOT_AVAILABLE_TABS.map((tab) => (
          <TabsTrigger key={tab.id} value={tab.id}>
            <tab.icon className="size-4" />
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="overview" className="mt-6">
        {overview}
      </TabsContent>
      <TabsContent value="products" className="mt-6">
        {products}
      </TabsContent>
      <TabsContent value="audit-logs" className="mt-6">
        {auditLogs}
      </TabsContent>
      <TabsContent value="ai-services" className="mt-6">
        {aiServices}
      </TabsContent>
      {NOT_AVAILABLE_TABS.map((tab) => (
        <TabsContent key={tab.id} value={tab.id} className="mt-6">
          <NotAvailablePanel icon={tab.icon} title={tab.title} description={tab.description} />
        </TabsContent>
      ))}
    </Tabs>
  )
}
