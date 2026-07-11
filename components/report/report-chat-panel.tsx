"use client"

// Follow-up chat entry point on the report page (not the print/PDF page —
// this is interactive-only chrome, deliberately not part of
// components/report/report-sections-list.tsx, which both surfaces share).
// History loads from GET and each turn posts to POST
// /api/reports/[reportId]/chat, which does the real ownership scoping
// server-side — this component trusts nothing about access itself.
import { useEffect, useRef, useState } from "react"
import { IconLoader2, IconMessageCircle, IconSend2 } from "@tabler/icons-react"
import ReactMarkdown from "react-markdown"

import { ChatProductCard } from "@/components/recommendations/chat-product-card"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { CHAT_MARKDOWN_COMPONENTS } from "@/components/recommendations/chat-markdown"
import type { AuroraProduct } from "@/lib/recommendations/types"

// Mirrors lib/ai/gemini-adapter.ts's REPORT_CHAT_MAX_QUESTION_LENGTH — kept
// as a local constant rather than importing that (server-only, fetch-using)
// module into client code. The API route enforces the real limit either way;
// this is just an input hint.
const MAX_QUESTION_LENGTH = 600

type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  products?: AuroraProduct[]
}

export function ReportChatPanel({ reportId }: { reportId: string }) {
  const [open, setOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [question, setQuestion] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open || loaded) return

    let cancelled = false

    async function loadHistory() {
      const response = await fetch(`/api/reports/${reportId}/chat`)
      if (cancelled) return

      if (response.ok) {
        const data = (await response.json()) as { messages: ChatMessage[] }
        setMessages(data.messages)
      }

      setLoaded(true)
    }

    void loadHistory()
    return () => {
      cancelled = true
    }
  }, [open, loaded, reportId])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages])

  async function sendQuestion() {
    const trimmed = question.trim()
    if (!trimmed || sending) return

    setSending(true)
    setError(null)

    // Optimistic: show the question immediately, replace with the real
    // saved id once the response comes back.
    const pendingId = `pending-${Date.now()}`
    setMessages((current) => [...current, { id: pendingId, role: "user", content: trimmed }])
    setQuestion("")

    const response = await fetch(`/api/reports/${reportId}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: trimmed }),
    })

    const data = (await response.json()) as {
      userMessage?: ChatMessage
      assistantMessage?: ChatMessage
      error?: string
    }

    setMessages((current) => {
      const withoutPending = current.filter((message) => message.id !== pendingId)
      const next = data.userMessage ? [...withoutPending, data.userMessage] : withoutPending
      return data.assistantMessage ? [...next, data.assistantMessage] : next
    })

    if (data.error) setError(data.error)
    setSending(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <IconMessageCircle className="size-4" />
          Ask about this report
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Ask Aura</SheetTitle>
          <SheetDescription>
            Follow-up questions about this scan&apos;s findings and recommendations — not a substitute for medical
            advice.
          </SheetDescription>
        </SheetHeader>

        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-8">
          {!loaded ? (
            <p className="text-sm text-muted-foreground">Loading conversation&hellip;</p>
          ) : messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ask about your findings, why a product was recommended, ingredients, or general skincare guidance.
            </p>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={
                  message.role === "user"
                    ? "ml-6 rounded-lg bg-primary px-4 py-2.5 text-sm text-primary-foreground"
                    : "mr-6 space-y-3 rounded-lg border border-border bg-muted px-4 py-2.5 text-sm text-foreground"
                }
              >
                {message.role === "assistant" ? (
                  <ReactMarkdown components={CHAT_MARKDOWN_COMPONENTS}>{message.content}</ReactMarkdown>
                ) : (
                  message.content
                )}

                {message.products?.length ? (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {message.products.map((product) => (
                      <ChatProductCard key={product.id} product={product} />
                    ))}
                  </div>
                ) : null}
              </div>
            ))
          )}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <div className="space-y-2 border-t border-border p-8 pt-4">
          <Textarea
            value={question}
            maxLength={MAX_QUESTION_LENGTH}
            placeholder="Ask a question about your report&hellip;"
            disabled={sending}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault()
                void sendQuestion()
              }
            }}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {question.length}/{MAX_QUESTION_LENGTH}
            </span>
            <Button size="sm" disabled={sending || !question.trim()} onClick={() => void sendQuestion()}>
              {sending ? <IconLoader2 className="size-4 animate-spin" /> : <IconSend2 className="size-4" />}
              Send
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
