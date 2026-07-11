import { cache } from "react"
import { connection } from "next/server"

import { getAdminUsageSnapshot } from "@/lib/admin/usage-analytics"
import { prisma } from "@/lib/db/client"
import { withDbRetry } from "@/lib/db/retry"

export const getUserDashboardStats = cache(async (userId: string) => {
  await connection()
  return withDbRetry(async () => {
    const [balance, scanCount, ledgerAgg] = await Promise.all([
      prisma.scanBalance.findUnique({ where: { userId } }),
      prisma.scan.count({ where: { userId } }),
      prisma.scanLedger.aggregate({
        where: { userId, delta: { lt: 0 } },
        _sum: { delta: true },
      }),
    ])

    const [recentLedger, profile, location] = await Promise.all([
      prisma.scanLedger.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 14,
        select: {
          delta: true,
          reason: true,
          tier: true,
          createdAt: true,
          metadata: true,
        },
      }),
      prisma.userProfile.findUnique({
        where: { userId },
        select: {
          skinType: true,
          primaryConcerns: true,
          onboardingCompletedAt: true,
        },
      }),
      prisma.userLocation.findUnique({
        where: { userId },
        select: { city: true, region: true, climateZone: true },
      }),
    ])

    const dailyUsage = bucketByDay(
      recentLedger.filter((e) => e.delta < 0),
      14,
    )

    return {
      remaining: balance?.remaining ?? 0,
      lifetimeUsed: balance?.lifetimeUsed ?? 0,
      lifetimeGranted: balance?.lifetimeGranted ?? 0,
      chatBudgetRemaining: Number(balance?.tokenBudgetRemaining ?? BigInt(0)),
      lifetimeChatTokensUsed: Number(balance?.lifetimeTokensUsed ?? BigInt(0)),
      scanCount,
      totalDebited: Math.abs(ledgerAgg._sum.delta ?? 0),
      profile,
      location,
      dailyUsage,
      recentActivity: recentLedger,
    }
  })
})

export const getAdminDashboardStats = cache(async () => {
  await connection()
  return withDbRetry(async () => {
    const thirtyDaysAgo = daysAgo(30)

    const [userCount, scanCount, productCount, usageSnapshot] = await Promise.all([
      prisma.user.count(),
      prisma.scan.count(),
      prisma.product.count({ where: { isActive: true } }),
      getAdminUsageSnapshot(),
    ])

    const [usersByRole, scansByStatus, recentUsers, scanActivity] =
      await Promise.all([
      prisma.user.groupBy({
        by: ["role"],
        _count: { role: true },
      }),
      prisma.scan.groupBy({
        by: ["status"],
        _count: { status: true },
      }),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      }),
      prisma.scanLedger.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        orderBy: { createdAt: "desc" },
        take: 100,
        select: { delta: true, reason: true, createdAt: true },
      }),
    ])

    const grantsByDay = bucketLedgerByDay(
      scanActivity.filter((e) => e.delta > 0),
      14,
    )
    const usageByDay = bucketLedgerByDay(
      scanActivity.filter((e) => e.delta < 0),
      14,
    )

    return {
      userCount,
      scanCount,
      productCount,
      scansGranted: usageSnapshot.scansGranted,
      scansUsed: usageSnapshot.scansUsed,
      scansToday: usageSnapshot.scansToday,
      chatsToday: usageSnapshot.chatsToday,
      aiTokens: usageSnapshot.allTimeTokens.totalTokens,
      estimatedCostMicros: usageSnapshot.allTimeTokens.estimatedCostMicros,
      tokenBreakdown: usageSnapshot.allTimeTokens,
      usersByRole: usersByRole.map((r) => ({
        role: r.role ?? "user",
        count: r._count.role,
      })),
      scansByStatus: scansByStatus.map((s) => ({
        status: s.status,
        count: s._count.status,
      })),
      recentUsers,
      grantsByDay,
      usageByDay,
      aiTokensByDay: usageSnapshot.tokenSeries14.map((bucket) => ({
        label: bucket.label,
        value: bucket.tokens,
      })),
      costByDay: usageSnapshot.costSeries14,
    }
  })
})

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

function bucketByDay(
  entries: { delta: number; createdAt: Date }[],
  days: number,
): { label: string; value: number }[] {
  const buckets = new Map<string, number>()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    buckets.set(d.toISOString().slice(0, 10), 0)
  }
  for (const entry of entries) {
    const key = entry.createdAt.toISOString().slice(0, 10)
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + Math.abs(entry.delta))
    }
  }
  return Array.from(buckets.entries()).map(([label, value]) => ({
    label: label.slice(5),
    value,
  }))
}

function bucketLedgerByDay(
  entries: { delta: number; createdAt: Date }[],
  days: number,
) {
  return bucketByDay(entries, days)
}
