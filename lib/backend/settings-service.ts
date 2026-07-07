import {
  listAiProviderEvents,
  listDownloads,
  listReports,
  listScans,
} from "@/lib/backend/report-store"
import { listProducts } from "@/lib/backend/product-service"

export type SettingsModuleStatus =
  | "Live"
  | "Configuration preview"
  | "Backend pending"
  | "Coming in Phase 2"
  | "Coming in Phase 3"
  | "Coming in Phase 4"

export type SettingsModuleTone = "ready" | "attention" | "preview"

export type SettingsItem = {
  label: string
  value: string
  detail: string
}

export type EnterpriseSettingsModule = {
  title: string
  description: string
  status: SettingsModuleStatus
  tone: SettingsModuleTone
  items: SettingsItem[]
}

export async function getEnterpriseSettingsModules() {
  const [scans, reports, downloads, aiEvents, products] = await Promise.all([
    listScans(),
    listReports(),
    listDownloads(),
    listAiProviderEvents(),
    listProducts(),
  ])
  const fallbackReports = reports.filter((report) => report.analysis.source === "fallback")
  const storedImageCount = scans.filter((scan) => scan.image.stored).length
  const activeProducts = products.filter((product) => product.active)

  return [
    {
      title: "Core Backend",
      description: "Live infrastructure status from the running server.",
      status: process.env.DATABASE_URL ? "Live" : "Backend pending",
      tone: process.env.DATABASE_URL ? "ready" : "attention",
      items: [
        {
          label: "PostgreSQL / Prisma",
          value: process.env.DATABASE_URL ? "Configured" : "Missing configuration",
          detail: process.env.DATABASE_URL
            ? "DATABASE_URL exists server-side. The connection string is not displayed."
            : "DATABASE_URL is not available to the server process.",
        },
        {
          label: "Persisted scans",
          value: String(scans.length),
          detail: "Real scan records currently stored in PostgreSQL.",
        },
        {
          label: "Persisted reports",
          value: String(reports.length),
          detail: "Real cosmetic report records currently stored in PostgreSQL.",
        },
      ],
    },
    {
      title: "AI Assessment",
      description: "Server-side Gemini configuration and provider event tracking.",
      status: process.env.GEMINI_API_KEY ? "Live" : "Backend pending",
      tone: process.env.GEMINI_API_KEY ? "ready" : "attention",
      items: [
        {
          label: "Gemini API key",
          value: process.env.GEMINI_API_KEY ? "Configured" : "Missing configuration",
          detail: process.env.GEMINI_API_KEY
            ? "Key is present server-side only. The key value is not displayed."
            : "GEMINI_API_KEY is not available to the server process.",
        },
        {
          label: "Gemini model",
          value: process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash",
          detail: "Model identifier used by the server-side Gemini adapter.",
        },
        {
          label: "Provider events",
          value: String(aiEvents.length),
          detail: "Real success/fallback provider events saved in PostgreSQL.",
        },
        {
          label: "Fallback reports",
          value: String(fallbackReports.length),
          detail: "Reports returned through the cosmetic fallback flow.",
        },
      ],
    },
    {
      title: "Reports And Downloads",
      description: "Phase 1 report persistence and printable report access.",
      status: "Live",
      tone: "ready",
      items: [
        {
          label: "Printable reports",
          value: "Enabled",
          detail: "Printable report route reads persisted reports from PostgreSQL.",
        },
        {
          label: "Download events",
          value: String(downloads.length),
          detail: "Real print/download access records saved in PostgreSQL.",
        },
        {
          label: "Binary PDF generation",
          value: "Configuration preview",
          detail: "Full generated PDF files are not implemented yet.",
        },
      ],
    },
    {
      title: "Privacy And Retention",
      description: "Current retention posture plus pending deletion workflows.",
      status: storedImageCount === 0 ? "Live" : "Backend pending",
      tone: storedImageCount === 0 ? "ready" : "attention",
      items: [
        {
          label: "Original scan images",
          value: storedImageCount === 0 ? "Not stored by default" : `${storedImageCount} stored`,
          detail:
            storedImageCount === 0
              ? "Current scan records indicate original images are not stored by default."
              : "Some scan records indicate original images were stored.",
        },
        {
          label: "Report retention",
          value: "Live",
          detail: "Cosmetic report records and recommendation snapshots are persisted.",
        },
        {
          label: "User delete/export workflow",
          value: "Coming in Phase 2",
          detail: "Self-service privacy workflows are not implemented yet.",
        },
      ],
    },
    {
      title: "Admin Roles And Access",
      description: "Authentication and admin role enforcement roadmap.",
      status: "Backend pending",
      tone: "attention",
      items: [
        {
          label: "Current admin guard",
          value: "Typed placeholder",
          detail: "better-auth is not installed yet, so admin protection is not a real session gate.",
        },
        {
          label: "Role-based access",
          value: "Coming in Phase 2",
          detail: "Owner, operations, privacy, and support roles are planned but not enforced.",
        },
        {
          label: "Email OTP sessions",
          value: "Coming in Phase 2",
          detail: "Session-backed admin login requires the future better-auth integration.",
        },
      ],
    },
    {
      title: "Product And Recommendation Controls",
      description: "Aurora product recommendation configuration status.",
      status: "Live",
      tone: "ready",
      items: [
        {
          label: "Recommendation engine",
          value: "Live",
          detail: "Rule-based recommendations are generated server-side from active PostgreSQL product records.",
        },
        {
          label: "Product catalog management",
          value: "Live",
          detail: "Admins can create, edit, activate, archive, and safely delete product records.",
        },
        {
          label: "Active products",
          value: String(activeProducts.length),
          detail: "Active database products available to the recommendation engine.",
        },
        {
          label: "Total products",
          value: String(products.length),
          detail: "All product records currently stored in PostgreSQL.",
        },
        {
          label: "Clinic-specific catalogs",
          value: "Coming in Phase 3",
          detail: "Clinic and marketplace catalog controls are future platform capabilities.",
        },
      ],
    },
    {
      title: "Enterprise Platform Roadmap",
      description: "Future platform capabilities shown as non-live configuration previews.",
      status: "Configuration preview",
      tone: "preview",
      items: [
        {
          label: "S3/R2 image storage",
          value: "Coming in Phase 2",
          detail: "Signed upload storage is not implemented yet.",
        },
        {
          label: "Payments and billing",
          value: "Coming in Phase 3",
          detail: "Payment systems are not live in Phase 1.",
        },
        {
          label: "White-label SaaS",
          value: "Coming in Phase 4",
          detail: "White-label tenant controls are a future platform capability.",
        },
        {
          label: "AI retraining controls",
          value: "Coming in Phase 4",
          detail: "AI retraining is not live and is not available from the admin dashboard.",
        },
      ],
    },
  ] satisfies EnterpriseSettingsModule[]
}
