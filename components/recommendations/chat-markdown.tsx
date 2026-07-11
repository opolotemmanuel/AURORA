// Shared react-markdown element styling for AI chat bubbles
// (report-chat-panel.tsx and skin-advice-chat.tsx) — one mapping so both
// chats render markdown identically instead of drifting apart. Only the
// elements the chat system prompts actually ask the model to use (short
// paragraphs, bold, bullet lists) get bespoke styling; the rest fall back to
// sane defaults in case the model still produces them occasionally.
import type { Components } from "react-markdown"

export const CHAT_MARKDOWN_COMPONENTS: Components = {
  p: ({ children }) => <p className="mb-2 leading-6 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>,
  li: ({ children }) => <li className="leading-6">{children}</li>,
  h1: ({ children }) => <p className="mb-1 font-semibold text-foreground">{children}</p>,
  h2: ({ children }) => <p className="mb-1 font-semibold text-foreground">{children}</p>,
  h3: ({ children }) => <p className="mb-1 font-semibold text-foreground">{children}</p>,
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
      {children}
    </a>
  ),
  code: ({ children }) => <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">{children}</code>,
}
