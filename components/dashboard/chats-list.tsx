import Link from "next/link"

import { ChatsListClient } from "@/components/dashboard/chats-list-client"
import type { AdviceChatListItem } from "@/components/dashboard/chats-list-client"
import { Button } from "@/components/ui/button"
import { requireAuthContext } from "@/lib/auth/context"
import { listAdviceConversations } from "@/lib/chat/conversation"

const CHATS_PAGE_SIZE = 20

type ChatsListProps = {
  page?: number
}

export async function ChatsList({ page = 1 }: ChatsListProps) {
  const ctx = await requireAuthContext()
  const { conversations, totalCount, totalPages, page: safePage } =
    await listAdviceConversations(ctx.userId, page, CHATS_PAGE_SIZE)

  const items: AdviceChatListItem[] = conversations.map((conversation) => {
    const preview = conversation.messages[0]?.content ?? "No messages yet"
    return {
      id: conversation.id,
      updatedAt: conversation.updatedAt.toISOString(),
      messageCount: conversation._count.messages,
      preview:
        preview.length > 120 ? `${preview.slice(0, 117).trimEnd()}…` : preview,
    }
  })

  if (totalCount === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="font-heading text-lg font-semibold">No advice chats yet</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Start a cosmetic skin guidance chat from the scan flow or open a new
          conversation below.
        </p>
        <Button asChild className="mt-6">
          <Link href="/scan">Go to scan</Link>
        </Button>
      </div>
    )
  }

  return (
    <ChatsListClient
      chats={items}
      page={safePage}
      totalPages={totalPages}
      totalCount={totalCount}
    />
  )
}
