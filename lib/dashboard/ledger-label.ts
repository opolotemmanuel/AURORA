import { formatTokenBreakdown } from "@/lib/tokens/format-usage"

type ChatDebitMetadata = {
  tokensDebited?: number
  modelId?: string
  inputTokens?: number
  outputTokens?: number
}

type ScanDebitMetadata = {
  modelId?: string
  inputTokens?: number
  outputTokens?: number
  cachedTokens?: number
  reasoningTokens?: number
}

const REASON_LABELS: Record<string, string> = {
  scan_debit: "Scan",
  chat_token_debit: "Skin advice chat",
  signup_bonus: "Free Starter scans",
  admin_grant: "Admin grant",
  pack_grant: "Scan pack",
  tier_upgrade: "Tier upgrade",
  adjustment: "Adjustment",
}

function humanizeReason(reason: string): string {
  return REASON_LABELS[reason] ?? reason.replace(/_/g, " ")
}

export function getLedgerShortLabel(reason: string): string {
  return humanizeReason(reason)
}

export function getLedgerDetail(reason: string, metadata: unknown): string | null {
  if (reason === "chat_token_debit") {
    const data = metadata as ChatDebitMetadata | null
    if (!data?.tokensDebited) {
      return null
    }
    const parts = [`${data.tokensDebited.toLocaleString()} tokens`]
    if (data.modelId) {
      parts.push(data.modelId)
    }
    return parts.join(" · ")
  }

  if (reason !== "scan_debit") {
    return null
  }

  const data = metadata as ScanDebitMetadata | null
  if (!data?.modelId) {
    return null
  }

  if (data.inputTokens == null || data.outputTokens == null) {
    return data.modelId
  }

  const tokens = formatTokenBreakdown({
    inputTokens: data.inputTokens,
    outputTokens: data.outputTokens,
    cachedTokens: data.cachedTokens,
    reasoningTokens: data.reasoningTokens,
  })

  return `${data.modelId} · ${tokens}`
}

export function getLedgerFullLabel(reason: string, metadata: unknown): string {
  const detail = getLedgerDetail(reason, metadata)
  const short = getLedgerShortLabel(reason)
  return detail ? `${short} · ${detail}` : short
}
