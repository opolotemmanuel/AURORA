// User-account listing for the admin "Users" section — a distinct domain
// from lib/backend/report-store.ts (scans/reports), so it gets its own
// module per AGENTS.md's "each domain gets its own module" rule.
import { prisma } from "@/lib/db"

export async function listUsers() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  })

  return users.map((user) => ({
    id: user.id,
    name: user.name ?? undefined,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  }))
}
