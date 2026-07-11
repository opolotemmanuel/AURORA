// General skin-advice chat — not scoped to one report (see
// app/api/reports/[reportId]/chat/route.ts for that narrower case). Grounds
// answers in the signed-in user's most recent scan when one exists, but
// works without one too.
import { NextResponse } from "next/server"

import {
  askSkinAdviceQuestion,
  SKIN_ADVICE_MAX_QUESTION_LENGTH,
  SkinAdviceQuestionTooLongError,
  type SkinAdviceContext,
} from "@/lib/ai/gemini-adapter"
import { listReportsForUser } from "@/lib/backend/report-store"
import {
  countSkinAdviceMessagesThisMonth,
  listSkinAdviceMessages,
  saveSkinAdviceMessage,
  SKIN_ADVICE_MONTHLY_MESSAGE_LIMIT,
} from "@/lib/backend/skin-advice-store"
import { getSession } from "@/lib/auth/session"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

async function loadContext(userId: string): Promise<SkinAdviceContext> {
  const [latest] = await listReportsForUser(userId, 1)
  if (!latest) return null

  return {
    summary: latest.analysis.summary,
    cosmeticFindings: latest.analysis.cosmeticFindings.map((finding) => ({
      label: finding.label,
      band: finding.band,
      observation: finding.observation,
    })),
  }
}

async function budgetFor(userId: string) {
  const used = await countSkinAdviceMessagesThisMonth(userId)
  return {
    used,
    limit: SKIN_ADVICE_MONTHLY_MESSAGE_LIMIT,
    remaining: Math.max(0, SKIN_ADVICE_MONTHLY_MESSAGE_LIMIT - used),
  }
}

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 })
  }

  const [messages, budget] = await Promise.all([
    listSkinAdviceMessages(session.user.id),
    budgetFor(session.user.id),
  ])

  return NextResponse.json({ messages, budget })
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const question =
    typeof body?.question === "string" ? body.question.trim() : ""

  if (!question) {
    return NextResponse.json({ error: "Enter a question." }, { status: 400 })
  }

  if (question.length > SKIN_ADVICE_MAX_QUESTION_LENGTH) {
    return NextResponse.json(
      {
        error: `Question must be ${SKIN_ADVICE_MAX_QUESTION_LENGTH} characters or fewer.`,
      },
      { status: 400 }
    )
  }

  const userId = session.user.id
  const [history, context] = await Promise.all([
    listSkinAdviceMessages(userId),
    loadContext(userId),
  ])

  const userMessage = await saveSkinAdviceMessage({
    userId,
    role: "user",
    content: question,
  })

  try {
    const answer = await askSkinAdviceQuestion(
      context,
      history.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      question
    )

    const assistantMessage = await saveSkinAdviceMessage({
      userId,
      role: "assistant",
      content: answer,
    })
    const budget = await budgetFor(userId)

    return NextResponse.json({ userMessage, assistantMessage, budget })
  } catch (error) {
    // The user's question is already saved (so it isn't lost on reload) —
    // only the assistant's turn failed, so report that distinctly rather
    // than rolling back or returning a generic 500.
    const message =
      error instanceof SkinAdviceQuestionTooLongError
        ? error.message
        : "Aura couldn't answer that just now. Try again in a moment."

    return NextResponse.json({ userMessage, error: message }, { status: 502 })
  }
}
