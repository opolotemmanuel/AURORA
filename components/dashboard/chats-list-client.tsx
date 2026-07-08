"use client"

import Link from "next/link"
import { IconChevronRight, IconMessage } from "@tabler/icons-react"

import { ChatsPagination } from "@/components/dashboard/chats-pagination"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type AdviceChatListItem = {
  id: string
  updatedAt: string
  messageCount: number
  preview: string
}

type ChatsListClientProps = {
  chats: AdviceChatListItem[]
  page: number
  totalPages: number
  totalCount: number
}

function formatChatDate(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso))
}

export function ChatsListClient({
  chats,
  page,
  totalPages,
  totalCount,
}: ChatsListClientProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {totalCount} advice {totalCount === 1 ? "chat" : "chats"} — not tied to
          a scan
        </p>
        <Button asChild size="sm" variant="outline">
          <Link href="/scan">New chat on scan</Link>
        </Button>
      </div>

      <ul className="divide-y divide-border rounded-lg border border-border bg-card">
        {chats.map((chat) => (
          <li key={chat.id}>
            <Link
              href={`/chats/${chat.id}`}
              className={cn(
                "flex items-start gap-3 px-4 py-4 transition-colors hover:bg-muted/30",
              )}
            >
              <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <IconMessage className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <p className="font-heading text-sm font-semibold">
                    Skin advice chat
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {formatChatDate(chat.updatedAt)}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {chat.preview}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {chat.messageCount}{" "}
                  {chat.messageCount === 1 ? "message" : "messages"}
                </p>
              </div>
              <IconChevronRight className="mt-2 size-4 shrink-0 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>

      <ChatsPagination page={page} totalPages={totalPages} />
    </div>
  )
}
