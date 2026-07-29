import { cache } from "react"
import { connection } from "next/server"

import { Prisma, type AiUsageFeature } from "@/generated/prisma/client"
import {
  buildBucketKeys,
  bucketKey,
  bucketLabel,
  getBucketGranularity,
  getPeriodStart,
  startOfUtcDay,
  truncUnit,
  type UsagePeriod,
} from "@/lib/admin/periods"
import { prisma } from "@/lib/db/client"
import { withDbRetry } from "@/lib/db/retry"
import { listModelRates } from "@/lib/models/queries"

export type { UsagePeriod }

/** Filter values exposed in the UI, mapped to the features they cover. */
export type UsageSource = "all" | "scan" | "chat" | "guardrail" | "transcribe"

const SOURCE_FEATURES: Record<UsageSource, AiUsageFeature[] | null> = {
  all: null,
  scan: ["scan_analyze", "scan_live"],
  chat: ["chat_reply", "chat_recommendations"],
  guardrail: ["chat_guardrail"],
  transcribe: ["transcribe"],
}

const SCAN_FEATURES = new Set<AiUsageFeature>(["scan_analyze", "scan_live"])

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

export type FeatureUsageRow = {
  feature: AiUsageFeature
  callCount: number
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
  perFeature: FeatureUsageRow[]
  highlights: UsageHighlights
}

type SumFields = {
  inputTokens: number | null
  outputTokens: number | null
  cachedTokens: number | null
  reasoningTokens: number | null
  totalTokens: number | null
  estimatedCostMicros: number | null
}

const SUM_SELECT = {
  inputTokens: true,
  outputTokens: true,
  cachedTokens: true,
  reasoningTokens: true,
  totalTokens: true,
  estimatedCostMicros: true,
} as const

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

function toBreakdown(sum: SumFields | null | undefined): TokenBreakdown {
  return {
    inputTokens: sum?.inputTokens ?? 0,
    outputTokens: sum?.outputTokens ?? 0,
    cachedTokens: sum?.cachedTokens ?? 0,
    reasoningTokens: sum?.reasoningTokens ?? 0,
    totalTokens: sum?.totalTokens ?? 0,
    estimatedCostMicros: sum?.estimatedCostMicros ?? 0,
  }
}

function addBreakdowns(a: TokenBreakdown, b: TokenBreakdown): TokenBreakdown {
  return {
    inputTokens: a.inputTokens + b.inputTokens,
    outputTokens: a.outputTokens + b.outputTokens,
    cachedTokens: a.cachedTokens + b.cachedTokens,
    reasoningTokens: a.reasoningTokens + b.reasoningTokens,
    totalTokens: a.totalTokens + b.totalTokens,
    estimatedCostMicros: a.estimatedCostMicros + b.estimatedCostMicros,
  }
}

function buildWhere(filters: Required<UsageFilters>): Prisma.AiUsageWhereInput {
  const start = getPeriodStart(filters.period)
  const features = SOURCE_FEATURES[filters.source] ?? null

  return {
    ...(start ? { createdAt: { gte: start } } : {}),
    ...(filters.modelId ? { modelId: filters.modelId } : {}),
    ...(features ? { feature: { in: features } } : {}),
  }
}

type TimeSeriesRow = {
  bucket: string
  tokens: bigint | number | null
  cost: bigint | number | null
  input: bigint | number | null
  output: bigint | number | null
  cached: bigint | number | null
  reasoning: bigint | number | null
}

/** `to_char` output is UTC wall time, so read it back as UTC. */
function parseBucketTimestamp(value: string): Date {
  return new Date(`${value.replace(" ", "T")}Z`)
}

function toNumber(value: bigint | number | null | undefined): number {
  if (value === null || value === undefined) return 0
  return typeof value === "bigint" ? Number(value) : value
}

async function fetchTimeSeries(
  filters: Required<UsageFilters>,
): Promise<UsageTimeBucket[]> {
  const granularity = getBucketGranularity(filters.period)
  const start = getPeriodStart(filters.period)
  const features = SOURCE_FEATURES[filters.source] ?? null

  const conditions: Prisma.Sql[] = []
  if (start) {
    conditions.push(Prisma.sql`"createdAt" >= ${start}`)
  }
  if (filters.modelId) {
    conditions.push(Prisma.sql`"modelId" = ${filters.modelId}`)
  }
  if (features) {
    conditions.push(
      Prisma.sql`"feature"::text IN (${Prisma.join(features.map((f) => Prisma.sql`${f}`))})`,
    )
  }
  const where =
    conditions.length > 0
      ? Prisma.sql`WHERE ${Prisma.join(conditions, " AND ")}`
      : Prisma.empty

  const rows = await prisma.$queryRaw<TimeSeriesRow[]>(Prisma.sql`
    SELECT
      to_char(
        date_trunc(${truncUnit(granularity)}, "createdAt"),
        'YYYY-MM-DD HH24:MI:SS'
      ) AS bucket,
      SUM("totalTokens") AS tokens,
      SUM(COALESCE("estimatedCostMicros", 0)) AS cost,
      SUM("inputTokens") AS input,
      SUM("outputTokens") AS output,
      SUM("cachedTokens") AS cached,
      SUM(COALESCE("reasoningTokens", 0)) AS reasoning
    FROM "ai_usage"
    ${where}
    GROUP BY 1
    ORDER BY 1 ASC
  `)

  const byKey = new Map<string, TimeSeriesRow>()
  for (const row of rows) {
    byKey.set(bucketKey(parseBucketTimestamp(row.bucket), granularity), row)
  }

  const earliest =
    rows.length > 0 ? parseBucketTimestamp(rows[0].bucket) : null

  return buildBucketKeys(filters.period, { earliest }).map((key) => {
    const row = byKey.get(key)
    return {
      label: bucketLabel(key, granularity),
      tokens: toNumber(row?.tokens),
      costMicros: toNumber(row?.cost),
      inputTokens: toNumber(row?.input),
      outputTokens: toNumber(row?.output),
      cachedTokens: toNumber(row?.cached),
      reasoningTokens: toNumber(row?.reasoning),
    }
  })
}

async function fetchPerModel(
  where: Prisma.AiUsageWhereInput,
  totalTokens: number,
): Promise<ModelUsageRow[]> {
  const [grouped, modelRates] = await Promise.all([
    prisma.aiUsage.groupBy({
      by: ["modelId", "feature"],
      where,
      _sum: SUM_SELECT,
      _count: { _all: true },
    }),
    listModelRates(),
  ])

  const meta = new Map(
    modelRates.map((rate) => [
      rate.modelId,
      { displayName: rate.displayName, assignedTier: rate.assignedTier },
    ]),
  )

  const byModel = new Map<
    string,
    { scanCount: number; chatCount: number; tokens: TokenBreakdown }
  >()

  for (const row of grouped) {
    const entry = byModel.get(row.modelId) ?? {
      scanCount: 0,
      chatCount: 0,
      tokens: emptyBreakdown(),
    }
    const count = row._count._all
    if (SCAN_FEATURES.has(row.feature)) {
      entry.scanCount += count
    } else {
      entry.chatCount += count
    }
    entry.tokens = addBreakdowns(entry.tokens, toBreakdown(row._sum))
    byModel.set(row.modelId, entry)
  }

  return [...byModel.entries()]
    .map(([modelId, entry]) => ({
      modelId,
      displayName: meta.get(modelId)?.displayName ?? null,
      assignedTier: meta.get(modelId)?.assignedTier ?? null,
      scanCount: entry.scanCount,
      chatCount: entry.chatCount,
      tokens: entry.tokens,
      sharePercent:
        totalTokens > 0
          ? Math.round((entry.tokens.totalTokens / totalTokens) * 1000) / 10
          : 0,
    }))
    .sort((a, b) => b.tokens.totalTokens - a.tokens.totalTokens)
}

async function fetchPerUser(
  where: Prisma.AiUsageWhereInput,
): Promise<UserUsageRow[]> {
  const top = await prisma.aiUsage.groupBy({
    by: ["userId"],
    where: { ...where, userId: { not: null } },
    _sum: SUM_SELECT,
    orderBy: { _sum: { totalTokens: "desc" } },
    take: 20,
  })

  const userIds = top
    .map((row) => row.userId)
    .filter((id): id is string => Boolean(id))

  if (userIds.length === 0) {
    return []
  }

  const [users, counts] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    }),
    prisma.aiUsage.groupBy({
      by: ["userId", "feature"],
      where: { ...where, userId: { in: userIds } },
      _count: { _all: true },
    }),
  ])

  const userById = new Map(users.map((user) => [user.id, user]))
  const countsByUser = new Map<string, { scanCount: number; chatCount: number }>()
  for (const row of counts) {
    if (!row.userId) continue
    const entry = countsByUser.get(row.userId) ?? { scanCount: 0, chatCount: 0 }
    if (SCAN_FEATURES.has(row.feature)) {
      entry.scanCount += row._count._all
    } else {
      entry.chatCount += row._count._all
    }
    countsByUser.set(row.userId, entry)
  }

  return top
    .filter((row): row is typeof row & { userId: string } => Boolean(row.userId))
    .map((row) => ({
      userId: row.userId,
      name: userById.get(row.userId)?.name ?? "Unknown",
      email: userById.get(row.userId)?.email ?? "",
      scanCount: countsByUser.get(row.userId)?.scanCount ?? 0,
      chatCount: countsByUser.get(row.userId)?.chatCount ?? 0,
      tokens: toBreakdown(row._sum),
    }))
}

async function fetchPerFeature(
  where: Prisma.AiUsageWhereInput,
): Promise<FeatureUsageRow[]> {
  const grouped = await prisma.aiUsage.groupBy({
    by: ["feature"],
    where,
    _sum: SUM_SELECT,
    _count: { _all: true },
  })

  return grouped
    .map((row) => ({
      feature: row.feature,
      callCount: row._count._all,
      tokens: toBreakdown(row._sum),
    }))
    .sort((a, b) => b.tokens.estimatedCostMicros - a.tokens.estimatedCostMicros)
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

async function getTodayHighlights(): Promise<
  Pick<UsageHighlights, "scansToday" | "chatsToday">
> {
  const todayStart = startOfUtcDay(new Date())

  const [scansToday, chatsToday] = await Promise.all([
    prisma.scanLedger.count({
      where: { reason: "scan_debit", createdAt: { gte: todayStart } },
    }),
    prisma.aiUsage.count({
      where: { feature: "chat_reply", createdAt: { gte: todayStart } },
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
      const where = buildWhere(filters)

      const [totals, chatCount, tokenSeries, perUser, perFeature, allowance, highlightsToday] =
        await Promise.all([
          prisma.aiUsage.aggregate({ where, _sum: SUM_SELECT }),
          prisma.aiUsage.count({ where: { ...where, feature: "chat_reply" } }),
          fetchTimeSeries(filters),
          fetchPerUser(where),
          fetchPerFeature(where),
          getScanAllowanceStats(getPeriodStart(filters.period)),
          getTodayHighlights(),
        ])

      const tokens = toBreakdown(totals._sum)
      const perModel = await fetchPerModel(where, tokens.totalTokens)

      const costSeries = tokenSeries.map((bucket) => ({
        label: bucket.label,
        value: Math.round((bucket.costMicros / 1_000_000) * 10000) / 10000,
      }))

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
        perFeature,
        highlights: {
          ...highlightsToday,
          mostActiveUser: perUser[0] ?? null,
          mostUsedModel: perModel[0] ?? null,
        },
      }
    })
  },
)

export const getAdminUsageSnapshot = cache(async () => {
  await connection()
  return withDbRetry(async () => {
    const todayStart = startOfUtcDay(new Date())

    const [allTime, allowance, scansToday, chatsToday, recentSeries] =
      await Promise.all([
        prisma.aiUsage.aggregate({ _sum: SUM_SELECT }),
        getScanAllowanceStats(null),
        prisma.scanLedger.count({
          where: { reason: "scan_debit", createdAt: { gte: todayStart } },
        }),
        prisma.aiUsage.count({
          where: { feature: "chat_reply", createdAt: { gte: todayStart } },
        }),
        fetchTimeSeries({ period: "30d", modelId: "", source: "all" }),
      ])

    const tokenSeries14 = recentSeries.slice(-14)
    const costSeries14 = tokenSeries14.map((bucket) => ({
      label: bucket.label,
      value: Math.round((bucket.costMicros / 1_000_000) * 10000) / 10000,
    }))

    return {
      allTimeTokens: toBreakdown(allTime._sum),
      scansGranted: allowance.scansGranted,
      scansUsed: allowance.scansUsed,
      scansToday,
      chatsToday,
      tokenSeries14,
      costSeries14,
    }
  })
})
