// Prisma data-access for SkinAdviceMessage — mirrors lib/backend/chat-store.ts's
// conventions for ReportChatMessage, but keyed by userId only (no reportId:
// this chat isn't tied to one report). Callers (app/api/skin-advice/chat/route.ts)
// are responsible for auth; these functions trust the userId they're given.
import { ChatMessageRole } from "@/lib/generated/prisma/client"
import { prisma } from "@/lib/db"

// A simple, honest per-user monthly allowance — not tiered, not billed,
// just a fixed constant the "messages left" indicator counts down from.
// 50/month, consistent with an unpaid feature backed by real Gemini API
// costs. Revisit if/when real per-plan quotas or enforcement get built.
export const SKIN_ADVICE_MONTHLY_MESSAGE_LIMIT = 50

export type SkinAdviceMessageRecord = {
  id: string
  userId: string
  role: "user" | "assistant"
  content: string
  createdAt: string
}

export async function listSkinAdviceMessages(
  userId: string
): Promise<SkinAdviceMessageRecord[]> {
  const messages = await prisma.skinAdviceMessage.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  })

  return messages.map(mapMessage)
}

export async function saveSkinAdviceMessage(input: {
  userId: string
  role: "user" | "assistant"
  content: string
}): Promise<SkinAdviceMessageRecord> {
  const message = await prisma.skinAdviceMessage.create({
    data: {
      userId: input.userId,
      role:
        input.role === "user"
          ? ChatMessageRole.USER
          : ChatMessageRole.ASSISTANT,
      content: input.content,
    },
  })

  return mapMessage(message)
}

// Backs the "~N messages left" indicator — a real count of this user's own
// messages sent this calendar month, not a fake/hardcoded number. Counts
// both roles (a user "turn" always produces two rows) since the budget is
// meant to read as "chat activity used," not strictly user-authored turns.
export async function countSkinAdviceMessagesThisMonth(
  userId: string
): Promise<number> {
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  return prisma.skinAdviceMessage.count({
    where: { userId, createdAt: { gte: startOfMonth } },
  })
}

function mapMessage(message: {
  id: string
  userId: string
  role: ChatMessageRole
  content: string
  createdAt: Date
}): SkinAdviceMessageRecord {
  return {
    id: message.id,
    userId: message.userId,
    role: message.role === ChatMessageRole.USER ? "user" : "assistant",
    content: message.content,
    createdAt: message.createdAt.toISOString(),
  }
}
