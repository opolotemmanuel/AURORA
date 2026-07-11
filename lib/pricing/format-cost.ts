export function formatMicroUsd(micros: number, decimals = 4): string {
  return `$${(micros / 1_000_000).toFixed(decimals)}`
}

export function formatMicroUsdCompact(micros: number): string {
  const dollars = micros / 1_000_000
  if (dollars >= 1) {
    return `$${dollars.toFixed(2)}`
  }
  if (dollars >= 0.01) {
    return `$${dollars.toFixed(3)}`
  }
  return formatMicroUsd(micros)
}

export function sumMicros(values: Array<number | null | undefined>): number {
  return values.reduce<number>((sum, value) => sum + (value ?? 0), 0)
}
