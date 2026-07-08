"use client"

import { useState } from "react"

import {
  AdviceChatToolbar,
  type AdviceChatToolbarProps,
} from "@/components/scan/advice-chat-toolbar"
import { ScanAdviceComposer } from "@/components/scan/scan-advice-composer"

type AdviceChatDetailProps = {
  conversationId: string
  title: string
  description: string
}

type AdviceToolbarState = Pick<
  AdviceChatToolbarProps,
  "onNewChat" | "startingNew" | "disabled"
>

export function AdviceChatDetail({
  conversationId,
  title,
  description,
}: AdviceChatDetailProps) {
  const [toolbar, setToolbar] = useState<AdviceToolbarState>({})

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <h1 className="font-heading text-2xl font-medium tracking-tight">
            {title}
          </h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <AdviceChatToolbar
          onNewChat={toolbar.onNewChat}
          startingNew={toolbar.startingNew}
          disabled={toolbar.disabled}
          showHistoryLink
        />
      </div>

      <ScanAdviceComposer
        mode="advice"
        inline
        hideAdviceHeader
        initialConversationId={conversationId}
        placeholder="Ask about routines, concerns & recommendations…"
        onToolbarStateChange={setToolbar}
      />
    </div>
  )
}
