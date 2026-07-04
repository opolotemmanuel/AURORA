export function getCreditValueMicros(): number {
  const raw = process.env.AURA_CREDIT_MICRO_USD
  const parsed = raw ? Number.parseInt(raw, 10) : 1000
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1000
}

export function formatCreditUsdValue(credits: number): string {
  const micros = credits * getCreditValueMicros()
  return `$${(micros / 1_000_000).toFixed(4)}`
}
