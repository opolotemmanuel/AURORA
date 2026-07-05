"use client"

import { useState } from "react"
import { IconStar, IconStarFilled } from "@tabler/icons-react"

import { FeedbackWidget } from "@/components/motion/feedback-widget"
import { submitScanFeedbackAction } from "@/lib/scan/submit-feedback-action"
import { cn } from "@/lib/utils"

export type ScanFeedbackRecord = {
  rating: number
  message: string | null
}

type ScanFeedbackWidgetProps = {
  scanId: string
  existingFeedback?: ScanFeedbackRecord | null
  position?: "bottom-right" | "bottom-left"
  className?: string
}

function StarRating({
  value,
  onChange,
  disabled,
}: {
  value: number
  onChange: (rating: number) => void
  disabled?: boolean
}) {
  return (
    <div
      className="flex items-center gap-1"
      role="radiogroup"
      aria-label="Rate your scan from 1 to 5 stars"
    >
      {Array.from({ length: 5 }, (_, index) => {
        const star = index + 1
        const filled = star <= value
        const Icon = filled ? IconStarFilled : IconStar
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} star${star === 1 ? "" : "s"}`}
            disabled={disabled}
            onClick={() => onChange(star)}
            className={cn(
              "grid size-8 place-items-center rounded-full transition-colors",
              filled ? "text-primary" : "text-muted-foreground",
              !disabled && "hover:bg-muted/60",
            )}
          >
            <Icon className="size-5" />
          </button>
        )
      })}
    </div>
  )
}

export function ScanFeedbackWidget({
  scanId,
  existingFeedback = null,
  position = "bottom-right",
  className,
}: ScanFeedbackWidgetProps) {
  const [rating, setRating] = useState(existingFeedback?.rating ?? 0)
  const [submitted, setSubmitted] = useState(existingFeedback != null)

  if (submitted) {
    return (
      <div
        className={cn(
          "pointer-events-none absolute bottom-4 z-30 rounded-full border border-border bg-background/90 px-3 py-1.5 text-xs text-muted-foreground shadow-sm backdrop-blur-sm",
          position === "bottom-left" ? "left-4" : "right-4",
          className,
        )}
      >
        Thanks for your feedback
      </div>
    )
  }

  return (
    <FeedbackWidget
      position={position}
      className={className}
      title="How was your scan?"
      placeholder="Optional comments about your results…"
      requireMessage={false}
      submitDisabled={rating === 0}
      headerContent={
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Rate your experience</p>
          <StarRating value={rating} onChange={setRating} />
        </div>
      }
      onSubmit={async ({ message }) => {
        const result = await submitScanFeedbackAction({
          scanId,
          rating,
          message: message.trim() || undefined,
        })
        if (!result.ok) {
          throw new Error(result.error)
        }
        setSubmitted(true)
      }}
    />
  )
}
