import type { AiProvider, Prisma, TokenLedgerReason } from "@/generated/prisma/client"

import { prisma } from "@/lib/db/client"

type DebitInput = {
  userId: string
  amount: number
  reason: TokenLedgerReason
  scanId?: string
  provider?: AiProvider
  metadata?: Prisma.InputJsonValue
}

async function debitTokensWithClient(
  tx: Prisma.TransactionClient,
  { userId, amount, reason, scanId, provider, metadata }: DebitInput,
) {
  if (amount <= 0) {
    throw new Error("Debit amount must be positive")
  }

  const wallet = await tx.tokenWallet.findUnique({ where: { userId } })
  if (!wallet || wallet.balance < amount) {
    throw new Error("Insufficient token balance")
  }

  const updated = await tx.tokenWallet.update({
    where: { userId },
    data: {
      balance: { decrement: amount },
      lifetimeUsed: { increment: amount },
    },
  })

  await tx.tokenLedger.create({
    data: {
      userId,
      delta: -amount,
      reason,
      scanId,
      provider,
      metadata: metadata ?? undefined,
    },
  })

  return updated
}

export async function debitTokensInTransaction(
  tx: Prisma.TransactionClient,
  input: DebitInput,
) {
  return debitTokensWithClient(tx, input)
}

export async function ensureTokenWallet(userId: string) {
  return prisma.tokenWallet.upsert({
    where: { userId },
    create: { userId, balance: 0 },
    update: {},
  })
}

export async function getBalance(userId: string): Promise<number> {
  const wallet = await ensureTokenWallet(userId)
  return wallet.balance
}

export async function grantTokens({
  userId,
  amount,
  reason,
  grantedById,
  scanId,
  provider,
  metadata,
}: {
  userId: string
  amount: number
  reason: TokenLedgerReason
  grantedById?: string
  scanId?: string
  provider?: AiProvider
  metadata?: Prisma.InputJsonValue
}) {
  if (amount <= 0) {
    throw new Error("Grant amount must be positive")
  }

  return prisma.$transaction(async (tx) => {
    const wallet = await tx.tokenWallet.upsert({
      where: { userId },
      create: {
        userId,
        balance: amount,
        lifetimeGranted: amount,
      },
      update: {
        balance: { increment: amount },
        lifetimeGranted: { increment: amount },
      },
    })

    await tx.tokenLedger.create({
      data: {
        userId,
        delta: amount,
        reason,
        grantedById,
        scanId,
        provider,
        metadata: metadata ?? undefined,
      },
    })

    return wallet
  })
}

export async function debitTokens({
  userId,
  amount,
  reason,
  scanId,
  provider,
  metadata,
}: {
  userId: string
  amount: number
  reason: TokenLedgerReason
  scanId?: string
  provider?: AiProvider
  metadata?: Prisma.InputJsonValue
}) {
  return prisma.$transaction((tx) =>
    debitTokensWithClient(tx, {
      userId,
      amount,
      reason,
      scanId,
      provider,
      metadata,
    }),
  )
}
