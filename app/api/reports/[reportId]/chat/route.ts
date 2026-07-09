// Follow-up chat about one report. Reuses the exact ownership-or-admin gate
// already used elsewhere (see lib/reports/load-report-view-model.ts and
// app/api/reports/[reportId]/route.ts) — same 404 for "doesn't exist" and
// "exists but isn't yours." Additionally requires report.userId to be
// non-null: an anonymous scan has no owner for a "your follow-up chat" to
// belong to, so chat is unavailable for those regardless of viewer (see
// lib/reports/report-view-model.ts's chatEnabled).
import { NextResponse } from "next/server"

import { getAdminPrincipal } from "@/lib/auth/admin"
import { getSession } from "@/lib/auth/session"
import { listReportChatMessages, saveReportChatMessage } from "@/lib/backend/chat-store"
import { findReport } from "@/lib/backend/report-store"
import type { StoredReport } from "@/lib/backend/types"
import {
  askAboutReport,
  REPORT_CHAT_MAX_QUESTION_LENGTH,
  ReportChatQuestionTooLongError,
  type ReportChatContext,
} from "@/lib/ai/gemini-adapter"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type RouteContext = { params: Promise<{ reportId: string }> }

async function authorize(reportId: string) {
  const session = await getSession()
  const report = await findReport(reportId)

  if (!report || !report.userId) {
    return { ok: false as const, status: 404 as const }
  }

  if (report.userId !== session?.user.id && !(await getAdminPrincipal())) {
    return { ok: false as const, status: 404 as const }
  }

  return { ok: true as const, report, userId: session!.user.id }
}

export async function GET(_request: Request, context: RouteContext) {
  const { reportId } = await context.params
  const auth = await authorize(reportId)

  if (!auth.ok) {
    return NextResponse.json({ error: "Report not found." }, { status: auth.status })
  }

  const messages = await listReportChatMessages(reportId)
  return NextResponse.json({ messages })
}

export async function POST(request: Request, context: RouteContext) {
  const { reportId } = await context.params
  const auth = await authorize(reportId)

  if (!auth.ok) {
    return NextResponse.json({ error: "Report not found." }, { status: auth.status })
  }

  const body = await request.json().catch(() => null)
  const question = typeof body?.question === "string" ? body.question.trim() : ""

  if (!question) {
    return NextResponse.json({ error: "Enter a question." }, { status: 400 })
  }

  if (question.length > REPORT_CHAT_MAX_QUESTION_LENGTH) {
    return NextResponse.json(
      { error: `Question must be ${REPORT_CHAT_MAX_QUESTION_LENGTH} characters or fewer.` },
      { status: 400 },
    )
  }

  const history = await listReportChatMessages(reportId)

  const userMessage = await saveReportChatMessage({
    reportId,
    userId: auth.userId,
    role: "user",
    content: question,
  })

  try {
    const answer = await askAboutReport(
      buildChatContext(auth.report),
      history.map((message) => ({ role: message.role, content: message.content })),
      question,
    )

    const assistantMessage = await saveReportChatMessage({
      reportId,
      userId: auth.userId,
      role: "assistant",
      content: answer,
    })

    return NextResponse.json({ userMessage, assistantMessage })
  } catch (error) {
    // The user's question is already saved (so it isn't lost on reload) —
    // only the assistant's turn failed, so report that distinctly rather
    // than rolling back or returning a generic 500.
    const message =
      error instanceof ReportChatQuestionTooLongError
        ? error.message
        : "Aura couldn't answer that just now. Try again in a moment."

    return NextResponse.json({ userMessage, error: message }, { status: 502 })
  }
}

function buildChatContext(report: StoredReport): ReportChatContext {
  return {
    summary: report.analysis.summary,
    cosmeticFindings: report.analysis.cosmeticFindings.map((finding) => ({
      label: finding.label,
      band: finding.band,
      observation: finding.observation,
    })),
    recommendations: report.recommendations.map((recommendation) => ({
      name: recommendation.product.name,
      category: recommendation.product.category,
      reason: recommendation.reasons.join(" "),
    })),
  }
}
