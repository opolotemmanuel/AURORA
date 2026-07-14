import sharp from "sharp"

import { classifyLuminance, type LightingBand } from "@/lib/scan/lighting"

// The real enforcement point for lighting quality, mirroring
// parseScanCoordinates in app/api/scan/analyze/route.ts: the Capture step's
// disabled button (components/scan/ScanFlow.tsx) is UX only and can be
// bypassed by calling this route directly, so the check has to happen here
// too. Downsamples to 32x32 before averaging — an approximate brightness
// reading is all that's needed, not per-pixel precision.
export async function checkImageLighting(buffer: Buffer): Promise<{
  band: LightingBand
  averageLuminance: number
}> {
  const { data, info } = await sharp(buffer)
    .resize(32, 32, { fit: "fill" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const channels = info.channels
  let total = 0
  for (let i = 0; i < data.length; i += channels) {
    total += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
  }
  const averageLuminance = total / (data.length / channels)

  return { band: classifyLuminance(averageLuminance), averageLuminance }
}
