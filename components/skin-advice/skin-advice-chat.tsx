"use client"

// Shared general skin-advice chat panel — used as /skin-advice's main
// content AND (per the scan flow's "Advice" tab) inside components/scan/ScanFlow.tsx.
// Visual style (bubble treatment, input row) matches
// components/report/report-chat-panel.tsx, but rendered inline as a panel
// rather than a Sheet, since this is a page's main content, not a drawer.
import { useEffect, useRef, useState } from "react"
import {
  IconLoader2,
  IconMicrophone,
  IconPaperclip,
  IconSend2,
  IconSparkles,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

// Mirrors lib/ai/gemini-adapter.ts's SKIN_ADVICE_MAX_QUESTION_LENGTH — kept
// local rather than importing that server-only module into client code, same
// reasoning as report-chat-panel.tsx. The API route enforces the real limit.
const MAX_QUESTION_LENGTH = 600

const SUGGESTED_PROMPTS = [
  "Routine for dry, sensitive skin?",
  "SPF tips for high UV?",
  "Natural ingredients to try?",
]

type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
}

type Budget = { used: number; limit: number; remaining: number }

// The Web Speech API's SpeechRecognition isn't in TypeScript's DOM lib (it's
// still non-standard/vendor-prefixed) — this is the minimal shape this
// component actually uses, kept local rather than pulling in a package for it.
type SpeechRecognitionResultLike = { transcript: string }
type SpeechRecognitionEventLike = {
  results: ArrayLike<ArrayLike<SpeechRecognitionResultLike>>
}
type SpeechRecognitionLike = {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
}
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}

export function SkinAdviceChat() {
  const [loaded, setLoaded] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [question, setQuestion] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [budget, setBudget] = useState<Budget | null>(null)
  const [isListening, setIsListening] = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadHistory() {
      const response = await fetch("/api/skin-advice/chat")
      if (cancelled) return

      if (response.ok) {
        const data = (await response.json()) as {
          messages: ChatMessage[]
          budget: Budget
        }
        setMessages(data.messages)
        setBudget(data.budget)
      }

      setLoaded(true)
    }

    void loadHistory()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const SpeechRecognitionCtor =
      window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!SpeechRecognitionCtor) return

    setVoiceSupported(true)
    const recognition = new SpeechRecognitionCtor()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = "en-US"
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript
      if (transcript) {
        setQuestion((current) =>
          current ? `${current} ${transcript}` : transcript
        )
      }
    }
    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)
    recognitionRef.current = recognition

    return () => {
      recognition.stop()
    }
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    })
  }, [messages])

  function toggleVoice() {
    if (!recognitionRef.current) return

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  async function sendQuestion(text: string) {
    const trimmed = text.trim()
    if (!trimmed || sending) return

    setSending(true)
    setError(null)

    const pendingId = `pending-${Date.now()}`
    setMessages((current) => [
      ...current,
      { id: pendingId, role: "user", content: trimmed },
    ])
    setQuestion("")

    const response = await fetch("/api/skin-advice/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: trimmed }),
    })

    const data = (await response.json()) as {
      userMessage?: ChatMessage
      assistantMessage?: ChatMessage
      budget?: Budget
      error?: string
    }

    setMessages((current) => {
      const withoutPending = current.filter(
        (message) => message.id !== pendingId
      )
      const next = data.userMessage
        ? [...withoutPending, data.userMessage]
        : withoutPending
      return data.assistantMessage ? [...next, data.assistantMessage] : next
    })

    if (data.budget) setBudget(data.budget)
    if (data.error) setError(data.error)
    setSending(false)
  }

  return (
    <Card className="flex h-[32rem] flex-col overflow-hidden py-0">
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-6">
        {!loaded ? (
          <p className="text-sm text-muted-foreground">
            Loading conversation&hellip;
          </p>
        ) : messages.length === 0 ? (
          <div className="space-y-4">
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <IconSparkles className="size-4 text-primary" />
              Ask about routines, ingredients, or general skincare guidance.
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <Button
                  key={prompt}
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={sending}
                  onClick={() => void sendQuestion(prompt)}
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={
                message.role === "user"
                  ? "ml-6 rounded-lg bg-primary px-4 py-2.5 text-sm text-primary-foreground"
                  : "mr-6 rounded-lg border border-border bg-muted px-4 py-2.5 text-sm text-foreground"
              }
            >
              {message.content}
            </div>
          ))
        )}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>

      <CardContent className="space-y-2 border-t border-border pt-4">
        <Textarea
          value={question}
          maxLength={MAX_QUESTION_LENGTH}
          placeholder="Ask a skincare question&hellip;"
          disabled={sending}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault()
              void sendQuestion(question)
            }
          }}
        />
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            {/* Attachments aren't built yet — visible per the reference layout,
                consistently disabled like the other roadmap placeholders in
                components/report/reports-table.tsx's ActionsMenu. */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled
              title="Attachments (coming soon)"
            >
              <IconPaperclip className="size-4" />
            </Button>
            {voiceSupported ? (
              <Button
                type="button"
                variant={isListening ? "default" : "ghost"}
                size="icon"
                onClick={toggleVoice}
                title={isListening ? "Stop voice input" : "Voice input"}
              >
                <IconMicrophone className="size-4" />
              </Button>
            ) : null}
            <span className="text-xs text-muted-foreground">
              {question.length}/{MAX_QUESTION_LENGTH}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {budget ? (
              <span className="text-xs text-muted-foreground">
                ~{budget.remaining} messages left
              </span>
            ) : null}
            <Button
              size="sm"
              disabled={sending || !question.trim()}
              onClick={() => void sendQuestion(question)}
            >
              {sending ? (
                <IconLoader2 className="size-4 animate-spin" />
              ) : (
                <IconSend2 className="size-4" />
              )}
              Send
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
