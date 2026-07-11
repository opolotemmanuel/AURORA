import { cache } from "react"
import { connection } from "next/server"

import { prisma } from "@/lib/db/client"
import { withDbRetry } from "@/lib/db/retry"
import { listModelRates } from "@/lib/models/queries"

export type UsagePeriod = "today" | "7d" | "30d" | "month" | "year" | "all"
export type UsageSource = "all" | "scan" | "chat"

export type UsageFilters = {
  period?: UsagePeriod
  modelId?: string
  source?: UsageSource
}

export type TokenBreakdown = {
  inputTokens: number
  outputTokens: number
  cachedTokens: number
  reasoningTokens: number
  totalTokens: number
  estimatedCostMicros: number
}

export type UsageTimeBucket = {
  label: string
  tokens: number
  costMicros: number
  inputTokens: number
  outputTokens: number
  cachedTokens: number
  reasoningTokens: number
}

export type ModelUsageRow = {
  modelId: string
  displayName: string | null
  assignedTier: string | null
  scanCount: number
  chatCount: number
  tokens: TokenBreakdown
  sharePercent: number
}

export type UserUsageRow = {
  userId: string
  name: string
  email: string
  scanCount: number
  chatCount: number
  tokens: TokenBreakdown
}

export type UsageHighlights = {
  mostActiveUser: UserUsageRow | null
  mostUsedModel: ModelUsageRow | null
  scansToday: number
  chatsToday: number
}

export type AdminUsageAnalytics = {
  filters: Required<UsageFilters>
  tokens: TokenBreakdown
  scansGranted: number
  scansUsed: number
  chatCount: number
  tokenSeries: UsageTimeBucket[]
  costSeries: { label: string; value: number }[]
  perModel: ModelUsageRow[]
  perUser: UserUsageRow[]
  highlights: UsageHighlights
}

type UsageRecord = {
  createdAt: Date
  inputTokens: number
  outputTokens: number
  cachedTokens: number
  reasoningTokens: number | null
  totalTokens: number
  estimatedCostMicros: number | null
  modelId: string | null
  userId?: string
  userName?: string
  userEmail?: string
  source: "scan" | "chat"
}

function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

export function getPeriodStart(period: UsagePeriod): Date | null {
  const now = new Date()
  switch (period) {
    case "today":
      return startOfDay(now)
    case "7d":
      return daysAgo(7)
    case "30d":
      return daysAgo(30)
    case "month":
      return new Date(now.getFullYear(), now.getMonth(), 1)
    case "year":
      return new Date(now.getFullYear(), 0, 1)
    case "all":
      return null
  }
}

function emptyBreakdown(): TokenBreakdown {
  return {
    inputTokens: 0,
    outputTokens: 0,
    cachedTokens: 0,
    reasoningTokens: 0,
    totalTokens: 0,
    estimatedCostMicros: 0,
  }
}

function sumBreakdowns(records: UsageRecord[]): TokenBreakdown {
  return records.reduce<TokenBreakdown>(
    (acc, row) => ({
      inputTokens: acc.inputTokens + row.inputTokens,
      outputTokens: acc.outputTokens + row.outputTokens,
      cachedTokens: acc.cachedTokens + row.cachedTokens,
      reasoningTokens: acc.reasoningTokens + (row.reasoningTokens ?? 0),
      totalTokens: acc.totalTokens + row.totalTokens,
      estimatedCostMicros:
        acc.estimatedCostMicros + (row.estimatedCostMicros ?? 0),
    }),
    emptyBreakdown(),
  )
}

function bucketKey(date: Date, period: UsagePeriod): string {
  if (period === "today") {
    return `${date.getHours().toString().padStart(2, "0")}:00`
  }
  if (period === "year") {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}`
  }
  return date.toISOString().slice(0, 10)
}

function bucketLabel(key: string, period: UsagePeriod): string {
  if (period === "today") {
    return key
  }
  if (period === "year") {
    const [, month] = key.split("-")
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ]
    return monthNames[Number(month) - 1] ?? key
  }
  return key.slice(5)
}

function buildBucketKeys(period: UsagePeriod): string[] {
  const now = new Date()
  if (period === "today") {
    return Array.from({ length: 24 }, (_, hour) =>
      `${hour.toString().padStart(2, "0")}:00`,
    )
  }
  if (period === "year") {
    return Array.from({ length: 12 }, (_, month) => {
      const d = new Date(now.getFullYear(), month, 1)
      return bucketKey(d, period)
    })
  }

  const days =
    period === "7d" ? 7 : period === "30d" || period === "month" ? 30 : 14

  return Array.from({ length: days }, (_, index) => {
    const d = new Date()
    d.setDate(d.getDate() - (days - 1 - index))
    return bucketKey(d, period)
  })
}

function buildTimeSeries(
  records: UsageRecord[],
  period: UsagePeriod,
): UsageTimeBucket[] {
  const keys = buildBucketKeys(period)
  const buckets = new Map<string, UsageTimeBucket>(
    keys.map((key) => [
      key,
      {
        label: bucketLabel(key, period),
        tokens: 0,
        costMicros: 0,
        inputTokens: 0,
        outputTokens: 0,
        cachedTokens: 0,
        reasoningTokens: 0,
      },
    ]),
  )

  for (const row of records) {
    const key = bucketKey(row.createdAt, period)
    const bucket = buckets.get(key)
    if (!bucket) {
      continue
    }
    bucket.tokens += row.totalTokens
    bucket.costMicros += row.estimatedCostMicros ?? 0
    bucket.inputTokens += row.inputTokens
    bucket.outputTokens += row.outputTokens
    bucket.cachedTokens += row.cachedTokens
    bucket.reasoningTokens += row.reasoningTokens ?? 0
  }

  return Array.from(buckets.values())
}

async function fetchUsageRecords(
  filters: Required<UsageFilters>,
): Promise<UsageRecord[]> {
  const start = getPeriodStart(filters.period)
  const dateFilter = start ? { gte: start } : undefined
  const records: UsageRecord[] = []

  if (filters.source === "all" || filters.source === "scan") {
    const scanRows = await prisma.scanUsage.findMany({
      where: {
        createdAt: dateFilter,
        ...(filters.modelId ? { modelId: filters.modelId } : {}),
      },
      select: {
        createdAt: true,
        inputTokens: true,
        outputTokens: true,
        cachedTokens: true,
        reasoningTokens: true,
        totalTokens: true,
        estimatedCostMicros: true,
        modelId: true,
        scan: {
          select: {
            userId: true,
            user: { select: { name: true, email: true } },
          },
        },
      },
    })

    for (const row of scanRows) {
      records.push({
        createdAt: row.createdAt,
        inputTokens: row.inputTokens,
        outputTokens: row.outputTokens,
        cachedTokens: row.cachedTokens,
        reasoningTokens: row.reasoningTokens,
        totalTokens: row.totalTokens,
        estimatedCostMicros: row.estimatedCostMicros,
        modelId: row.modelId,
        userId: row.scan.userId,
        userName: row.scan.user.name,
        userEmail: row.scan.user.email,
        source: "scan",
      })
    }
  }

  if (filters.source === "all" || filters.source === "chat") {
    const chatRows = await prisma.chatMessage.findMany({
      where: {
        role: "assistant",
        blocked: false,
        createdAt: dateFilter,
        ...(filters.modelId ? { modelId: filters.modelId } : {}),
      },
      select: {
        createdAt: true,
        inputTokens: true,
        outputTokens: true,
        cachedTokens: true,
        reasoningTokens: true,
        totalTokens: true,
        estimatedCostMicros: true,
        modelId: true,
        conversation: {
          select: {
            userId: true,
            user: { select: { name: true, email: true } },
          },
        },
      },
    })

    for (const row of chatRows) {
      records.push({
        createdAt: row.createdAt,
        inputTokens: row.inputTokens,
        outputTokens: row.outputTokens,
        cachedTokens: row.cachedTokens,
        reasoningTokens: row.reasoningTokens,
        totalTokens: row.totalTokens,
        estimatedCostMicros: row.estimatedCostMicros,
        modelId: row.modelId,
        userId: row.conversation.userId,
        userName: row.conversation.user.name,
        userEmail: row.conversation.user.email,
        source: "chat",
      })
    }
  }

  return records
}

function groupByModel(
  records: UsageRecord[],
  modelNames: Map<string, { displayName: string | null; assignedTier: string | null }>,
  totalTokens: number,
): ModelUsageRow[] {
  const map = new Map<string, { scanCount: number; chatCount: number; records: UsageRecord[] }>()

  for (const row of records) {
    const modelId = row.modelId ?? "unknown"
    const entry = map.get(modelId) ?? { scanCount: 0, chatCount: 0, records: [] }
    if (row.source === "scan") {
      entry.scanCount += 1
    } else {
      entry.chatCount += 1
    }
    entry.records.push(row)
    map.set(modelId, entry)
  }

  return Array.from(map.entries())
    .map(([modelId, entry]) => {
      const tokens = sumBreakdowns(entry.records)
      const meta = modelNames.get(modelId)
      return {
        modelId,
        displayName: meta?.displayName ?? null,
        assignedTier: meta?.assignedTier ?? null,
        scanCount: entry.scanCount,
        chatCount: entry.chatCount,
        tokens,
        sharePercent:
          totalTokens > 0
            ? Math.round((tokens.totalTokens / totalTokens) * 1000) / 10
            : 0,
      }
    })
    .sort((a, b) => b.tokens.totalTokens - a.tokens.totalTokens)
}

function groupByUser(records: UsageRecord[]): UserUsageRow[] {
  const map = new Map<
    string,
    {
      name: string
      email: string
      scanCount: number
      chatCount: number
      records: UsageRecord[]
    }
  >()

  for (const row of records) {
    if (!row.userId) {
      continue
    }
    const entry = map.get(row.userId) ?? {
      name: row.userName ?? "Unknown",
      email: row.userEmail ?? "",
      scanCount: 0,
      chatCount: 0,
      records: [],
    }
    if (row.source === "scan") {
      entry.scanCount += 1
    } else {
      entry.chatCount += 1
    }
    entry.records.push(row)
    map.set(row.userId, entry)
  }

  return Array.from(map.entries())
    .map(([userId, entry]) => ({
      userId,
      name: entry.name,
      email: entry.email,
      scanCount: entry.scanCount,
      chatCount: entry.chatCount,
      tokens: sumBreakdowns(entry.records),
    }))
    .sort((a, b) => b.tokens.totalTokens - a.tokens.totalTokens)
    .slice(0, 20)
}

async function getScanAllowanceStats(start: Date | null) {
  const dateFilter = start ? { gte: start } : undefined

  const [granted, used] = await Promise.all([
    prisma.scanLedger.aggregate({
      where: { delta: { gt: 0 }, createdAt: dateFilter },
      _sum: { delta: true },
    }),
    prisma.scanLedger.aggregate({
      where: { delta: { lt: 0 }, reason: "scan_debit", createdAt: dateFilter },
      _sum: { delta: true },
    }),
  ])

  return {
    scansGranted: granted._sum.delta ?? 0,
    scansUsed: Math.abs(used._sum.delta ?? 0),
  }
}

async function getTodayHighlights(): Promise<Pick<UsageHighlights, "scansToday" | "chatsToday">> {
  const todayStart = startOfDay(new Date())

  const [scansToday, chatsToday] = await Promise.all([
    prisma.scanLedger.count({
      where: { reason: "scan_debit", createdAt: { gte: todayStart } },
    }),
    prisma.chatMessage.count({
      where: {
        role: "assistant",
        blocked: false,
        createdAt: { gte: todayStart },
      },
    }),
  ])

  return { scansToday, chatsToday }
}

export const getAdminUsageAnalytics = cache(
  async (input: UsageFilters = {}): Promise<AdminUsageAnalytics> => {
    await connection()

    const filters: Required<UsageFilters> = {
      period: input.period ?? "30d",
      modelId: input.modelId ?? "",
      source: input.source ?? "all",
    }

    return withDbRetry(async () => {
      const [records, allowance, highlightsToday, modelRates] = await Promise.all([
        fetchUsageRecords(filters),
        getScanAllowanceStats(getPeriodStart(filters.period)),
        getTodayHighlights(),
        listModelRates(),
      ])

      const tokens = sumBreakdowns(records)
      const chatCount = records.filter((r) => r.source === "chat").length
      const modelNames = new Map(
        modelRates.map((m) => [
          m.modelId,
          { displayName: m.displayName, assignedTier: m.assignedTier },
        ]),
      )

      const perModel = groupByModel(records, modelNames, tokens.totalTokens)
      const perUser = groupByUser(records)
      const tokenSeries = buildTimeSeries(records, filters.period)
      const costSeries = tokenSeries.map((bucket) => ({
        label: bucket.label,
        value: Math.round((bucket.costMicros / 1_000_000) * 10000) / 10000,
      }))

      const highlights: UsageHighlights = {
        ...highlightsToday,
        mostActiveUser: perUser[0] ?? null,
        mostUsedModel: perModel[0] ?? null,
      }

      return {
        filters,
        tokens,
        scansGranted: allowance.scansGranted,
        scansUsed: allowance.scansUsed,
        chatCount,
        tokenSeries,
        costSeries,
        perModel,
        perUser,
        highlights,
      }
    })
  },
)

export const getAdminUsageSnapshot = cache(async () => {
  await connection()
  return withDbRetry(async () => {
    const fourteenDaysAgo = daysAgo(14)
    const todayStart = startOfDay(new Date())

    const [scanUsage, chatUsage, allowance, scansToday, chatsToday] =
      await Promise.all([
        prisma.scanUsage.aggregate({
          _sum: {
            inputTokens: true,
            outputTokens: true,
            cachedTokens: true,
            reasoningTokens: true,
            totalTokens: true,
            estimatedCostMicros: true,
          },
        }),
        prisma.chatMessage.aggregate({
          where: { role: "assistant", blocked: false },
          _sum: {
            inputTokens: true,
            outputTokens: true,
            cachedTokens: true,
            reasoningTokens: true,
            totalTokens: true,
            estimatedCostMicros: true,
          },
        }),
        getScanAllowanceStats(null),
        prisma.scanLedger.count({
          where: { reason: "scan_debit", createdAt: { gte: todayStart } },
        }),
        prisma.chatMessage.count({
          where: {
            role: "assistant",
            blocked: false,
            createdAt: { gte: todayStart },
          },
        }),
      ])

    const combineSum = (
      a: typeof scanUsage._sum,
      b: typeof chatUsage._sum,
    ): TokenBreakdown => ({
      inputTokens: (a.inputTokens ?? 0) + (b.inputTokens ?? 0),
      outputTokens: (a.outputTokens ?? 0) + (b.outputTokens ?? 0),
      cachedTokens: (a.cachedTokens ?? 0) + (b.cachedTokens ?? 0),
      reasoningTokens: (a.reasoningTokens ?? 0) + (b.reasoningTokens ?? 0),
      totalTokens: (a.totalTokens ?? 0) + (b.totalTokens ?? 0),
      estimatedCostMicros:
        (a.estimatedCostMicros ?? 0) + (b.estimatedCostMicros ?? 0),
    })

    const allTimeTokens = combineSum(scanUsage._sum, chatUsage._sum)

    const recentRecords = (
      await fetchUsageRecords({
        period: "30d",
        modelId: "",
        source: "all",
      })
    ).filter((r) => r.createdAt >= fourteenDaysAgo)

    const tokenSeries14 = buildTimeSeries(recentRecords, "30d").slice(-14)

    const costSeries14 = tokenSeries14.map((bucket) => ({
      label: bucket.label,
      value: Math.round((bucket.costMicros / 1_000_000) * 10000) / 10000,
    }))

    return {
      allTimeTokens,
      scansGranted: allowance.scansGranted,
      scansUsed: allowance.scansUsed,
      scansToday,
      chatsToday,
      tokenSeries14,
      costSeries14,
    }
  })
})
