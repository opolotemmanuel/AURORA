// Prisma data-access for ReportChatMessage — the only file that talks to
// Prisma for this model, matching report-store.ts's convention. Callers
// (app/api/reports/[reportId]/chat/route.ts) are responsible for the
// ownership check before calling anything here; these functions trust the
// reportId/userId they're given.
import { ChatMessageRole } from "@/lib/generated/prisma/client"
import { prisma } from "@/lib/db"

export type ChatMessageRecord = {
  id: string
  reportId: string
  userId: string
  role: "user" | "assistant"
  content: string
  createdAt: string
}

export async function listReportChatMessages(reportId: string): Promise<ChatMessageRecord[]> {
  const messages = await prisma.reportChatMessage.findMany({
    where: { reportId },
    orderBy: { createdAt: "asc" },
  })

  return messages.map(mapMessage)
}

export async function saveReportChatMessage(input: {
  reportId: string
  userId: string
  role: "user" | "assistant"
  content: string
}): Promise<ChatMessageRecord> {
  const message = await prisma.reportChatMessage.create({
    data: {
      reportId: input.reportId,
      userId: input.userId,
      role: input.role === "user" ? ChatMessageRole.USER : ChatMessageRole.ASSISTANT,
      content: input.content,
    },
  })

  return mapMessage(message)
}

function mapMessage(message: {
  id: string
  reportId: string
  userId: string
  role: ChatMessageRole
  content: string
  createdAt: Date
}): ChatMessageRecord {
  return {
    id: message.id,
    reportId: message.reportId,
    userId: message.userId,
    role: message.role === ChatMessageRole.USER ? "user" : "assistant",
    content: message.content,
    createdAt: message.createdAt.toISOString(),
  }
}
