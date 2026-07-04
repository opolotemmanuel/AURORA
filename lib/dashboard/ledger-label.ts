type ScanDebitMetadata = {
  modelId?: string
  inputTokens?: number
  outputTokens?: number
  creditsCharged?: number
}

const REASON_LABELS: Record<string, string> = {
  scan_debit: "Scan",
  signup_bonus: "Signup bonus",
  admin_grant: "Admin grant",
  admin_debit: "Admin debit",
  promotion: "Promotion",
}

function humanizeReason(reason: string): string {
  return REASON_LABELS[reason] ?? reason.replace(/_/g, " ")
}

export function getLedgerShortLabel(reason: string): string {
  return humanizeReason(reason)
}

export function getLedgerDetail(reason: string, metadata: unknown): string | null {
  if (reason !== "scan_debit") {
    return null
  }

  const data = metadata as ScanDebitMetadata | null
  if (!data?.modelId) {
    return null
  }

  const tokens =
    data.inputTokens != null && data.outputTokens != null
      ? `${data.inputTokens.toLocaleString()} in / ${data.outputTokens.toLocaleString()} out`
      : null

  return tokens ? `${data.modelId} · ${tokens}` : data.modelId
}

export function getLedgerFullLabel(reason: string, metadata: unknown): string {
  const detail = getLedgerDetail(reason, metadata)
  const short = getLedgerShortLabel(reason)
  return detail ? `${short} · ${detail}` : short
}
