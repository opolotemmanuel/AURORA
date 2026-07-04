export const DISCLAIMER_VERSION = "1.0"

export const SKIN_DISCLAIMER =
  "This assessment is for cosmetic and wellness guidance only. It is not a medical diagnosis. Consult a licensed professional for clinical concerns."

export const REPORT_FORMAT_VERSION = "1.0"

export function getScanTokenCost(): number {
  const raw = process.env.SCAN_TOKEN_COST
  const parsed = raw ? Number.parseInt(raw, 10) : 1000
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1000
}
