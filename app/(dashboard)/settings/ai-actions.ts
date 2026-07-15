"use server"

// Server action backing the AI Services tab's "Test AI" button — makes one
// real, lightweight Gemini call (text-only, no image) through the existing
// skin-advice chat path, and reports success/failure honestly. Consumes
// real Gemini quota per click, which is why it's a manual button rather
// than something run automatically on page load. Deliberately does NOT
// write an AiProviderEvent row: those are scoped to real scan-analysis
// calls (see lib/backend/scan-service.ts) and mixing in diagnostic pings
// would skew the AI Services tab's own success-rate/duration stats.
import { askSkinAdviceQuestion, GeminiAnalysisError } from "@/lib/ai/gemini-adapter"
import { saveAuditLog } from "@/lib/backend/report-store"
import { requireAdminAccess } from "@/lib/auth/admin"

export type TestGeminiResult = {
  success: boolean
  message: string
  durationMs: number
}

export async function testGeminiConnectivityAction(): Promise<TestGeminiResult> {
  const auth = await requireAdminAccess("settings:manage")
  const startedAt = Date.now()

  try {
    await askSkinAdviceQuestion(
      null,
      [],
      [],
      "This is an admin connectivity test. Reply with a short acknowledgement only."
    )
    const durationMs = Date.now() - startedAt

    await saveAuditLog({
      actorId: auth.principal.id,
      actorRole: auth.principal.role,
      action: "Ran Gemini connectivity test (success)",
      targetType: "admin",
      targetId: "ai-services",
    })

    return { success: true, message: "Gemini responded successfully.", durationMs }
  } catch (error) {
    const durationMs = Date.now() - startedAt
    const message = error instanceof GeminiAnalysisError ? error.message : "Gemini call failed."

    await saveAuditLog({
      actorId: auth.principal.id,
      actorRole: auth.principal.role,
      action: "Ran Gemini connectivity test (failed)",
      targetType: "admin",
      targetId: "ai-services",
    })

    return { success: false, message, durationMs }
  }
}
