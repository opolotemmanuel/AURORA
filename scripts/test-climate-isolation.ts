// Isolation test for the climate-aware routine-tips prompt
// (lib/ai/gemini-adapter.ts's buildCosmeticPrompt). Verifies this feature's
// core safety constraint: the SAME image must produce IDENTICAL
// cosmeticFindings regardless of climate context, while routineTips may
// genuinely vary. Run this — and get a real PASS — before trusting the
// climate-aware routine tips feature; it was not verified with a real
// Gemini call as part of building it (no GEMINI_API_KEY was available in
// the environment that built it).
//
// Usage: npm run test:climate-isolation -- path/to/real-face-photo.jpg
//    or: node --experimental-transform-types scripts/test-climate-isolation.ts path/to/real-face-photo.jpg
//
// The --experimental-transform-types flag is required (not just Node's
// default TS type-stripping): gemini-adapter.ts's GeminiAnalysisError uses
// a TS parameter-property constructor, which strip-only mode rejects.
//
// Makes 3 real, billed Gemini API calls against the same image: no climate
// context, hot/dry/high-UV context, and cold/humid context. Reads
// GEMINI_API_KEY from .env.local by hand (like scripts/sync-products.ts) —
// plain `node` doesn't auto-load it the way Next.js dev/build does.
import { readFileSync } from "node:fs"

import { analyzeSkinWithGemini } from "../lib/ai/gemini-adapter.ts"
import type { ClimateSnapshot } from "../lib/climate/adapter.ts"

// Deliberately far apart on every axis from each other (and from "mild"
// conditions) so any real climate leakage into cosmeticFindings has the
// best possible chance of showing up.
const HOT_DRY_HIGH_UV: ClimateSnapshot = { temperatureC: 38, humidityPercent: 15, uvIndex: 10 }
const COLD_HUMID: ClimateSnapshot = { temperatureC: 2, humidityPercent: 85, uvIndex: 1 }

function readEnvVar(name: string): string {
  const envText = readFileSync(".env.local", "utf8")
  const line = envText.split("\n").find((entry) => entry.trim().startsWith(`${name}`))
  if (!line) {
    throw new Error(`${name} not found in .env.local`)
  }

  return line
    .slice(line.indexOf("=") + 1)
    .trim()
    .replace(/^"|"$/g, "")
}

function toFile(path: string): File {
  const bytes = readFileSync(path)
  const mimeType = path.endsWith(".png") ? "image/png" : path.endsWith(".webp") ? "image/webp" : "image/jpeg"
  return new File([new Uint8Array(bytes)], path.split("/").pop() ?? "image.jpg", { type: mimeType })
}

function findingsSignature(findings: Array<{ label: string; band: string; observation: string }>): string {
  return findings.map((finding) => `${finding.label} | ${finding.band} | ${finding.observation}`).join("\n")
}

async function main() {
  const imagePath = process.argv[2]
  if (!imagePath) {
    console.error("Usage: npm run test:climate-isolation -- path/to/real-face-photo.jpg")
    process.exit(1)
  }

  if (!process.env.GEMINI_API_KEY) {
    process.env.GEMINI_API_KEY = readEnvVar("GEMINI_API_KEY")
  }

  console.log(`Running 3 sequential, real Gemini calls against ${imagePath} — this spends real quota.\n`)

  console.log("1/3: no climate context (baseline)...")
  const baseline = await analyzeSkinWithGemini(toFile(imagePath), null)

  console.log("2/3: hot / dry / high-UV climate context...")
  const hot = await analyzeSkinWithGemini(toFile(imagePath), HOT_DRY_HIGH_UV)

  console.log("3/3: cold / humid climate context...")
  const cold = await analyzeSkinWithGemini(toFile(imagePath), COLD_HUMID)

  const baselineSignature = findingsSignature(baseline.cosmeticFindings)
  const hotSignature = findingsSignature(hot.cosmeticFindings)
  const coldSignature = findingsSignature(cold.cosmeticFindings)
  const findingsIdentical = baselineSignature === hotSignature && baselineSignature === coldSignature

  console.log("\n=== cosmeticFindings (must be IDENTICAL across all 3 runs) ===")
  console.log("No climate:\n" + baselineSignature)
  console.log("\nHot/dry/high-UV:\n" + hotSignature)
  console.log("\nCold/humid:\n" + coldSignature)
  console.log(`\ncosmeticFindings identical across all 3 runs: ${findingsIdentical ? "YES" : "NO — SAFETY FAILURE"}`)

  console.log("\n=== routineTips (expected to genuinely vary) ===")
  console.log("No climate:      ", baseline.routineTips)
  console.log("Hot/dry/high-UV: ", hot.routineTips)
  console.log("Cold/humid:      ", cold.routineTips)

  if (!findingsIdentical) {
    console.error(
      "\nFAILED: cosmeticFindings changed based on climate context alone with the same image. " +
        "Do not ship this feature as-is — see the safety-boundary comment above " +
        "lib/ai/gemini-adapter.ts's buildCosmeticPrompt for why two-pass generation " +
        "(separating routine-tip generation into its own model call) would be the safer fallback.",
    )
    process.exit(1)
  }

  console.log("\nPASSED: cosmeticFindings stayed identical across all 3 climate contexts.")
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
