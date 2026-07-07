export const DISCLAIMER_VERSION = "1.1"

export const CONSULTATION_BOOKING_URL =
  "https://calendly.com/auroraorganic4u"

export const SKIN_DISCLAIMER =
  "This report is for cosmetic and wellness guidance only. Results may vary with lighting, photo quality, and changes in your skin. It is not a medical diagnosis. For clinical concerns, seek advice from a licensed healthcare professional."

export const REPORT_SECTION_TITLES = {
  snapshot: "Your skin snapshot",
  dosha: "Ayurvedic skin lean",
  weather: "Your local weather",
  areas: "Key skin areas",
  everydayCare: "Everyday care",
  products: "Product matches",
} as const

export const REPORT_FORMAT_VERSION = "1.2"

export function getScanTokenCost(): number {
  const raw = process.env.SCAN_TOKEN_COST
  const parsed = raw ? Number.parseInt(raw, 10) : 1000
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1000
}

export function getMinScanCredits(): number {
  const raw = process.env.SCAN_TOKEN_COST_MIN
  if (raw) {
    const parsed = Number.parseInt(raw, 10)
    if (Number.isFinite(parsed) && parsed > 0) return parsed
  }
  return getScanTokenCost()
}
