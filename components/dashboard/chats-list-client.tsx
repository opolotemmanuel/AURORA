"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import {
  IconLoader2,
  IconMessage,
  IconTrash,
} from "@tabler/icons-react"

import { ChatsPagination } from "@/components/dashboard/chats-pagination"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  deleteAdviceChatAction,
  deleteAllAdviceChatsAction,
} from "@/lib/chat/actions"
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
  const router = useRouter()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [clearingAll, setClearingAll] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDeleteChat(conversationId: string) {
    setPendingId(conversationId)
    setError(null)
    try {
      await deleteAdviceChatAction(conversationId)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete chat.")
    } finally {
      setPendingId(null)
    }
  }

  async function handleClearAll() {
    setClearingAll(true)
    setError(null)
    try {
      await deleteAllAdviceChatsAction()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not clear chats.")
    } finally {
      setClearingAll(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {totalCount} advice {totalCount === 1 ? "chat" : "chats"} — not tied to
          a scan
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {totalCount > 0 ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  disabled={clearingAll}
                >
                  {clearingAll ? (
                    <IconLoader2 className="size-3.5 animate-spin" />
                  ) : (
                    <IconTrash className="size-3.5" />
                  )}
                  Clear all chats
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear all advice chats?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently deletes every skin advice chat on your account.
                    Scan follow-up chats stay with their reports. This cannot be
                    undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => void handleClearAll()}>
                    Clear all chats
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}
          <Button asChild size="sm" variant="outline">
            <Link href="/scan">New chat on scan</Link>
          </Button>
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <ul className="divide-y divide-border rounded-lg border border-border bg-card">
        {chats.map((chat) => {
          const deleting = pendingId === chat.id

          return (
            <li
              key={chat.id}
              className="flex items-start gap-2 px-2 py-2 sm:gap-3 sm:px-4 sm:py-4"
            >
              <Link
                href={`/chats/${chat.id}`}
                className={cn(
                  "flex min-w-0 flex-1 items-start gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/30 sm:px-0 sm:py-0 sm:hover:bg-transparent",
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
              </Link>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="mt-1 shrink-0 text-muted-foreground hover:text-destructive"
                    disabled={deleting}
                    aria-label="Delete chat"
                  >
                    {deleting ? (
                      <IconLoader2 className="size-4 animate-spin" />
                    ) : (
                      <IconTrash className="size-4" />
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this chat?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This permanently removes the conversation and its messages.
                      This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => void handleDeleteChat(chat.id)}
                    >
                      Delete chat
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </li>
          )
        })}
      </ul>

      <ChatsPagination page={page} totalPages={totalPages} />
    </div>
  )
}
