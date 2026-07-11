import { ConsultationBookingButton } from "@/components/chat/consultation-booking-button"
import { cn } from "@/lib/utils"

type ChatMessageFooterProps = {
  consultationNote?: string | null
  className?: string
}

export function ChatMessageFooter({
  consultationNote,
  className,
}: ChatMessageFooterProps) {
  if (!consultationNote) {
    return null
  }

  return (
    <div
      className={cn(
        "space-y-2 border-t border-border/50 pt-2",
        className,
      )}
    >
      <p className="text-[11px] leading-snug text-muted-foreground">
        {consultationNote}
      </p>
      <ConsultationBookingButton />
    </div>
  )
}
