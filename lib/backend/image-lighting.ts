import { writeFile } from "node:fs/promises"
import { join } from "node:path"
import sharp from "sharp"

import { classifyLuminance, type LightingBand } from "@/lib/scan/lighting"

// TEMPORARY diagnostic dir — saves the exact uploaded buffer so it can be
// inspected directly during the lighting-check bug investigation. Never
// committed; deleted once real evidence has been captured.
const DIAGNOSTIC_DIR =
  "/tmp/claude-1000/-home-emma-AURA/cd2b7384-22ca-45fd-a719-5c0ba31fc8ca/scratchpad"

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

  // TEMPORARY diagnostic logging — see the lighting-check bug investigation.
  // Removed once real evidence has been captured.
  console.log(
    `[lighting-diagnostic] averageLuminance=${averageLuminance.toFixed(2)} band=${classifyLuminance(averageLuminance)} channels=${channels} bufferBytes=${buffer.length}`
  )
  try {
    const fileName = `lighting-diagnostic-${Date.now()}.jpg`
    await writeFile(join(DIAGNOSTIC_DIR, fileName), buffer)
    console.log(`[lighting-diagnostic] saved uploaded buffer to ${fileName}`)
  } catch (error) {
    console.log("[lighting-diagnostic] failed to save buffer:", error)
  }

  return { band: classifyLuminance(averageLuminance), averageLuminance }
}
