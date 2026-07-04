import { prisma } from "@/lib/db/client"

import { TokenGrantForm } from "./token-grant-form"

export type TokenGrantUser = {
  id: string
  name: string | null
  email: string
  balance: number
}

export async function TokenGrantPanel() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      tokenWallet: { select: { balance: true } },
    },
    orderBy: [{ name: "asc" }, { email: "asc" }],
    take: 200,
  })

  const grantUsers: TokenGrantUser[] = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    balance: user.tokenWallet?.balance ?? 0,
  }))

  return <TokenGrantForm users={grantUsers} />
}
