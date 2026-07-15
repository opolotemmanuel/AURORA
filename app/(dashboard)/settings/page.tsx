import { IconSettings } from "@tabler/icons-react"

import {
  activateProductAction,
  createProductAction,
  deactivateProductAction,
  deleteProductAction,
  updateProductAction,
} from "@/app/(dashboard)/settings/product-actions"
import { getAiServiceStatus } from "@/lib/backend/ai-services"
import { listProducts } from "@/lib/backend/product-service"
import { listAuditLogs, saveAuditLog } from "@/lib/backend/report-store"
import {
  checkDatabaseConnectivity,
  checkWeatherService,
  getGeminiSignal,
  getOverviewCounts,
  getPlatformVersion,
} from "@/lib/backend/system-overview"
import { AdminAccessError, requireAdminAccess } from "@/lib/auth/admin"
import { AccessDenied } from "@/components/admin/access-denied"
import { AiServicesPanel } from "@/components/admin/settings/ai-services-panel"
import { AuditLogPanel } from "@/components/admin/settings/audit-log-panel"
import { OverviewPanel } from "@/components/admin/settings/overview-panel"
import { ProductPanel } from "@/components/admin/settings/product-panel"
import { SettingsTabs } from "@/components/admin/settings/settings-tabs"

export const dynamic = "force-dynamic"

// Requires the stronger "settings:manage" permission (not just
// "admin:read") since this page both shows config status and lets an admin
// mutate the product catalog via the server actions in product-actions.ts.
export default async function SettingsPage() {
  let auth
  try {
    auth = await requireAdminAccess("settings:manage")
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return <AccessDenied note={error.access.note} />
    }
    throw error
  }

  const [platformVersion, databaseCheck, weatherCheck, geminiSignal, counts, products, auditLogs, aiServiceStatus] =
    await Promise.all([
      getPlatformVersion(),
      checkDatabaseConnectivity(),
      checkWeatherService(),
      getGeminiSignal(),
      getOverviewCounts(),
      listProducts(),
      listAuditLogs(),
      getAiServiceStatus(),
    ])

  await saveAuditLog({
    actorId: auth.principal.id,
    actorRole: auth.principal.role,
    action: "Viewed enterprise settings dashboard",
    targetType: "admin",
    targetId: "settings",
  })

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <p className="flex items-center gap-2 text-xs font-semibold tracking-widest text-primary uppercase">
          <IconSettings className="size-4" />
          Enterprise Operations
        </p>
        <h1 className="text-3xl font-semibold tracking-normal">Settings</h1>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
          Platform configuration console for Aurora SkinSense. Every value across these tabs comes from a real
          server check or a real PostgreSQL record — tabs for capabilities that don&apos;t exist yet say so
          honestly instead of showing a fake control.
        </p>
      </section>

      <SettingsTabs
        overview={
          <OverviewPanel
            platformVersion={platformVersion}
            checks={[databaseCheck, geminiSignal, weatherCheck]}
            counts={counts}
          />
        }
        products={
          <ProductPanel
            products={products}
            actions={{
              create: createProductAction,
              update: updateProductAction,
              activate: activateProductAction,
              deactivate: deactivateProductAction,
              remove: deleteProductAction,
            }}
          />
        }
        auditLogs={<AuditLogPanel entries={auditLogs} />}
        aiServices={<AiServicesPanel status={aiServiceStatus} />}
      />
    </div>
  )
}
