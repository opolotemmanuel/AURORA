"use client"

import { useCallback, useEffect, useState } from "react"
import {
  IconBulb,
  IconCamera,
  IconCrop,
  IconSun,
  IconUpload,
  IconUser,
  IconX,
} from "@tabler/icons-react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"

import { EASE_OUT } from "@/lib/ease"
import { cn } from "@/lib/utils"

const HINTS_VERSION = "2"
const STORAGE_KEY = "aura-scan-camera-hints-dismissed"
const PANEL_TITLE = "Tips for better scans"

type HintItem = {
  id: string
  icon: typeof IconUser
  title: string
  body: string
}

const HINTS: HintItem[] = [
  {
    id: "distance",
    icon: IconUser,
    title: "Move closer",
    body: "Face should fill a large part of the oval — aim for 40–60% of frame height.",
  },
  {
    id: "lighting",
    icon: IconSun,
    title: "Improve lighting",
    body: "Face a window or soft front light. Avoid backlighting and harsh overhead glare.",
  },
  {
    id: "crop",
    icon: IconCrop,
    title: "On the crop step",
    body: "Expand the crop box so your face fills most of it — not lots of background.",
  },
  {
    id: "upload",
    icon: IconUpload,
    title: "Try photo upload",
    body: "A phone photo (often 2–4MP+) usually assesses much better than a laptop webcam.",
  },
  {
    id: "mobile",
    icon: IconCamera,
    title: "On mobile",
    body: "Use the front camera in good light — phone sensors are typically higher resolution.",
  },
]

function isHintsDismissed() {
  if (typeof window === "undefined") return true
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return false
    const parsed = JSON.parse(raw) as { version?: string; dismissed?: boolean }
    return parsed.version === HINTS_VERSION && parsed.dismissed === true
  } catch {
    return false
  }
}

function persistDismissed() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ version: HINTS_VERSION, dismissed: true }),
  )
}

type ScanCameraHintsProps = {
  /** Desktop: to the right of the capture section. Mobile fullscreen: fixed on screen edge. */
  placement?: "section" | "fullscreen"
  className?: string
}

export function ScanCameraHints({
  placement = "section",
  className,
}: ScanCameraHintsProps) {
  const reduceMotion = useReducedMotion()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(!isHintsDismissed())
  }, [])

  const dismissAll = useCallback(() => {
    persistDismissed()
    setVisible(false)
  }, [])

  if (!visible) {
    return null
  }

  const stagger = (index: number) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, x: 20, filter: "blur(4px)" },
          animate: {
            opacity: 1,
            x: 0,
            filter: "blur(0px)",
            transition: {
              duration: 0.28,
              ease: EASE_OUT,
              delay: 0.06 + index * 0.07,
            },
          },
          exit: {
            opacity: 0,
            x: 12,
            filter: "blur(4px)",
            transition: { duration: 0.18, ease: EASE_OUT },
          },
        }

  return (
    <motion.aside
      initial={reduceMotion ? false : { opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      transition={{ duration: 0.3, ease: EASE_OUT }}
      className={cn(
        "pointer-events-none z-20 w-[260px]",
        placement === "section" &&
          "absolute left-[calc(100%+1rem)] top-10 hidden md:block",
        placement === "fullscreen" &&
          "fixed right-3 top-[max(5.5rem,env(safe-area-inset-top))] md:hidden",
        className,
      )}
      aria-label={PANEL_TITLE}
    >
      <div className="pointer-events-auto flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2 rounded-xl border border-border/80 bg-background/95 px-3 py-2 shadow-md backdrop-blur-sm">
          <div className="flex min-w-0 items-center gap-2">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
              <IconBulb className="size-3.5" aria-hidden />
            </span>
            <p className="truncate text-xs font-semibold text-foreground">
              {PANEL_TITLE}
            </p>
          </div>
          <button
            type="button"
            onClick={dismissAll}
            aria-label="Dismiss tips"
            className="grid size-6 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <IconX className="size-3.5" />
          </button>
        </div>

        <AnimatePresence initial={false}>
          {HINTS.map((hint, index) => {
            const Icon = hint.icon
            return (
              <motion.div
                key={hint.id}
                layout={!reduceMotion}
                {...stagger(index)}
                className="rounded-xl border border-border/80 bg-background/90 p-3 shadow-md backdrop-blur-sm"
              >
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                    <Icon className="size-3.5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="text-xs font-semibold text-foreground">
                      {hint.title}
                    </p>
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      {hint.body}
                    </p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </motion.aside>
  )
}
