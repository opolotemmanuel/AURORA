import { PrivacyControls } from "@/components/dashboard/privacy-controls"
import { DashboardPageHeader } from "@/components/dashboard/page-header"
import { requireSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db/client"

export default async function PrivacyPage() {
  const session = await requireSession()
  const scans = await prisma.scan.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, status: true, createdAt: true },
  })

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        title="Privacy"
        description="Delete individual items or all personal data. Account deletion is permanent."
      />
      <PrivacyControls
        scans={scans.map((s) => ({
          id: s.id,
          status: s.status,
          createdAt: s.createdAt.toISOString(),
        }))}
      />
    </div>
  )
}
