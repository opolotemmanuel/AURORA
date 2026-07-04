import { PrivacyControls } from "@/components/dashboard/privacy-controls"
import { requireAuthContext } from "@/lib/auth/context"
import { prisma } from "@/lib/db/client"

export async function PrivacyControlsLoader() {
  const ctx = await requireAuthContext()
  const scans = await prisma.scan.findMany({
    where: { userId: ctx.userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, status: true, createdAt: true },
  })

  return (
    <PrivacyControls
      scans={scans.map((s) => ({
        id: s.id,
        status: s.status,
        createdAt: s.createdAt.toISOString(),
      }))}
    />
  )
}
