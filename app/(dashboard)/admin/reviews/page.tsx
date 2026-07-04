import { DashboardPageHeader } from "@/components/dashboard/page-header"
import { requireRole } from "@/lib/auth/session"

export default async function ExpertReviewsPage() {
  await requireRole(["admin", "expert"])

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        title="Review queue"
        description="Expert review of scan results before users see them — coming in a future release."
        badge="Soon"
      />
      <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        No scans awaiting expert review.
      </div>
    </div>
  )
}
