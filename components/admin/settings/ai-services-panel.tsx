"use client"

// AI Services tab — real Gemini configuration and event-derived reliability
// stats from lib/backend/ai-services.ts, plus an opt-in "Test AI" button
// that makes one real Gemini call via app/(dashboard)/settings/ai-actions.ts.
// Model/key are shown read-only: they're env-driven, not runtime-editable,
// so there is no fake "save" control for them here.
import { useState, useTransition } from "react"
import { IconCircleCheck, IconCircleX, IconSparkles } from "@tabler/icons-react"

import { testGeminiConnectivityAction, type TestGeminiResult } from "@/app/(dashboard)/settings/ai-actions"
import type { getAiServiceStatus } from "@/lib/backend/ai-services"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

type AiServiceStatus = Awaited<ReturnType<typeof getAiServiceStatus>>

export function AiServicesPanel({ status }: { status: AiServiceStatus }) {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<TestGeminiResult | null>(null)

  function runTest() {
    setResult(null)
    startTransition(async () => {
      const outcome = await testGeminiConnectivityAction()
      setResult(outcome)
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <p className="flex items-center gap-2 text-xs font-semibold tracking-widest text-primary uppercase">
            <IconSparkles className="size-4" />
            AI Services
          </p>
          <CardTitle className="mt-2">Gemini configuration</CardTitle>
          <CardDescription className="mt-2 max-w-3xl leading-6">
            Read-only — these values come from server environment configuration, not an editable form, since
            changing them requires a real deploy, not a database row.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <InfoRow
            label="Gemini API key"
            value={status.apiKeyConfigured ? "Configured" : "Missing configuration"}
            detail={
              status.apiKeyConfigured
                ? "Key is present server-side only. The key value is never displayed."
                : "GEMINI_API_KEY is not available to the server process."
            }
          />
          <InfoRow label="Model" value={status.model} detail="GEMINI_MODEL env override, or the adapter's default." />
          <InfoRow
            label="Recorded calls"
            value={String(status.totalEvents)}
            detail="Real scan-analysis AiProviderEvent rows saved in PostgreSQL."
          />
          <InfoRow
            label="Success rate"
            value={status.successRatePercent !== undefined ? `${status.successRatePercent}%` : "No data yet"}
            detail={`${status.successCount} of ${status.totalEvents} recorded calls succeeded.`}
          />
          <InfoRow
            label="Average response time"
            value={status.averageDurationMs !== undefined ? `${status.averageDurationMs}ms` : "No data yet"}
            detail="Averaged across recorded calls that reported a duration."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test AI connectivity</CardTitle>
          <CardDescription className="mt-2 max-w-3xl leading-6">
            Sends one real, lightweight text-only message to Gemini and reports whether it succeeded. This uses
            real API quota each time you click it.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button type="button" onClick={runTest} disabled={isPending} className="w-fit">
            {isPending ? "Testing..." : "Test AI"}
          </Button>

          {result ? (
            <div className="flex items-start gap-3 rounded-lg border border-border bg-muted p-4">
              {result.success ? (
                <IconCircleCheck className="mt-0.5 size-5 shrink-0 text-primary" />
              ) : (
                <IconCircleX className="mt-0.5 size-5 shrink-0 text-destructive" />
              )}
              <div>
                <p className="text-sm font-medium">{result.success ? "Success" : "Failed"}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {result.message} ({result.durationMs}ms)
                </p>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

function InfoRow({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="grid gap-2 rounded-lg border border-border bg-muted p-4 sm:grid-cols-[1fr_auto] sm:items-center">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p>
      </div>
      <Badge variant="outline" className="text-left sm:text-right">
        {value}
      </Badge>
    </div>
  )
}
