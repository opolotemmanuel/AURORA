import { TokenGrantForm } from "@/components/admin/token-grant-form"
import { DashboardPageHeader } from "@/components/dashboard/page-header"
import { requireAdmin } from "@/lib/auth/session"

export default async function AdminTokensPage() {
  await requireAdmin()

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        title="Tokens"
        description="Grant simulated credits to users for scans and AI usage."
        badge="Admin"
      />
      <TokenGrantForm />
    </div>
  )
}
