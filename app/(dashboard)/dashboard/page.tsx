import { requireSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db/client"
import { getBalance } from "@/lib/tokens/wallet"

export default async function DashboardPage() {
  const session = await requireSession()
  const balance = await getBalance(session.user.id)
  const profile = await prisma.userProfile.findUnique({
    where: { userId: session.user.id },
  })

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-heading text-2xl font-medium">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back, {session.user.name}. Cosmetic guidance only — not a medical diagnosis.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Token balance</p>
          <p className="font-heading text-2xl font-medium">{balance.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Skin type</p>
          <p className="font-heading text-2xl font-medium capitalize">
            {profile?.skinType ?? "—"}
          </p>
        </div>
      </div>
    </div>
  )
}
