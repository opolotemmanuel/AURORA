// Real Gemini status for the Enterprise Settings "AI Services" tab —
// separate module from system-overview.ts's one-line Gemini signal, since
// this tab needs the fuller picture (success rate, avg duration, recent
// events) rather than just "healthy or not." Every number here is derived
// from real AiProviderEvent rows written by lib/backend/scan-service.ts;
// nothing is invented.
import { getGeminiModel } from "@/lib/ai/gemini-adapter"
import { listAiProviderEvents } from "@/lib/backend/report-store"

export async function getAiServiceStatus() {
  const events = await listAiProviderEvents()
  const successCount = events.filter((event) => event.status === "success").length
  const durations = events.map((event) => event.durationMs).filter((value): value is number => typeof value === "number")
  const averageDurationMs = durations.length
    ? Math.round(durations.reduce((total, value) => total + value, 0) / durations.length)
    : undefined

  return {
    apiKeyConfigured: Boolean(process.env.GEMINI_API_KEY),
    model: getGeminiModel(),
    totalEvents: events.length,
    successCount,
    successRatePercent: events.length ? Math.round((successCount / events.length) * 100) : undefined,
    averageDurationMs,
    recentEvents: events.slice(0, 20),
  }
}
