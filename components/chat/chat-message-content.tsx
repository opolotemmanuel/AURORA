import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

const INLINE_PATTERN =
  /(\*\*(.+?)\*\*|\*(.+?)\*|_(.+?)_|`([^`]+)`|\[([^\]]+)\]\((https?:\/\/[^)]+)\))/g

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = []
  let lastIndex = 0
  let matchIndex = 0

  for (const match of text.matchAll(INLINE_PATTERN)) {
    const index = match.index ?? 0
    if (index > lastIndex) {
      nodes.push(text.slice(lastIndex, index))
    }

    const key = `${keyPrefix}-inline-${matchIndex}`
    matchIndex += 1

    if (match[2]) {
      nodes.push(
        <strong key={key} className="font-semibold">
          {match[2]}
        </strong>,
      )
    } else if (match[3] || match[4]) {
      nodes.push(
        <em key={key} className="italic">
          {match[3] ?? match[4]}
        </em>,
      )
    } else if (match[5]) {
      nodes.push(
        <code
          key={key}
          className="rounded-sm bg-background/80 px-1 py-0.5 font-mono text-[0.85em]"
        >
          {match[5]}
        </code>,
      )
    } else if (match[6] && match[7]) {
      nodes.push(
        <a
          key={key}
          href={match[7]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline underline-offset-2"
        >
          {match[6]}
        </a>,
      )
    }

    lastIndex = index + match[0].length
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex))
  }

  return nodes.length > 0 ? nodes : [text]
}

function renderParagraph(text: string, key: string) {
  const lines = text.split("\n")
  return (
    <p key={key} className="whitespace-pre-wrap">
      {lines.map((line, lineIndex) => (
        <span key={`${key}-line-${lineIndex}`}>
          {lineIndex > 0 ? <br /> : null}
          {renderInline(line, `${key}-line-${lineIndex}`)}
        </span>
      ))}
    </p>
  )
}

function parseMarkdownBlocks(content: string): ReactNode[] {
  const lines = content.replace(/\r\n/g, "\n").split("\n")
  const blocks: ReactNode[] = []
  let index = 0
  let blockIndex = 0

  while (index < lines.length) {
    const line = lines[index]
    const trimmed = line.trim()

    if (!trimmed) {
      index += 1
      continue
    }

    const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/)
    if (headingMatch) {
      const level = headingMatch[1].length
      const HeadingTag = level === 1 ? "h3" : level === 2 ? "h4" : "h5"
      blocks.push(
        <HeadingTag
          key={`block-${blockIndex}`}
          className={cn(
            "font-heading font-semibold text-foreground",
            level === 1 ? "text-sm" : "text-sm",
          )}
        >
          {renderInline(headingMatch[2], `block-${blockIndex}-heading`)}
        </HeadingTag>,
      )
      blockIndex += 1
      index += 1
      continue
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = []
      while (index < lines.length && /^[-*]\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^[-*]\s+/, ""))
        index += 1
      }
      blocks.push(
        <ul key={`block-${blockIndex}`} className="list-disc space-y-1 pl-4">
          {items.map((item, itemIndex) => (
            <li key={`block-${blockIndex}-item-${itemIndex}`}>
              {renderInline(item, `block-${blockIndex}-item-${itemIndex}`)}
            </li>
          ))}
        </ul>,
      )
      blockIndex += 1
      continue
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = []
      while (index < lines.length && /^\d+\.\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^\d+\.\s+/, ""))
        index += 1
      }
      blocks.push(
        <ol key={`block-${blockIndex}`} className="list-decimal space-y-1 pl-4">
          {items.map((item, itemIndex) => (
            <li key={`block-${blockIndex}-item-${itemIndex}`}>
              {renderInline(item, `block-${blockIndex}-item-${itemIndex}`)}
            </li>
          ))}
        </ol>,
      )
      blockIndex += 1
      continue
    }

    const paragraphLines: string[] = []
    while (index < lines.length) {
      const current = lines[index]
      const currentTrimmed = current.trim()
      if (!currentTrimmed) break
      if (
        /^(#{1,3})\s+/.test(currentTrimmed) ||
        /^[-*]\s+/.test(currentTrimmed) ||
        /^\d+\.\s+/.test(currentTrimmed)
      ) {
        break
      }
      paragraphLines.push(current)
      index += 1
    }

    blocks.push(
      renderParagraph(paragraphLines.join("\n"), `block-${blockIndex}`),
    )
    blockIndex += 1
  }

  return blocks
}

type ChatMessageContentProps = {
  content: string
  markdown?: boolean
  className?: string
}

export function ChatMessageContent({
  content,
  markdown = false,
  className,
}: ChatMessageContentProps) {
  if (!content) return null

  if (!markdown) {
    return (
      <p className={cn("whitespace-pre-wrap", className)}>{content}</p>
    )
  }

  return (
    <div className={cn("space-y-2 [&_a]:break-all", className)}>
      {parseMarkdownBlocks(content)}
    </div>
  )
}
