"use client"

import Link from "next/link"
import { IconLayoutDashboard, IconX } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ScanDashboardLinkProps = {
  className?: string
  variant?: "icon" | "label" | "segment"
}

export function ScanDashboardLink({
  className,
  variant = "label",
}: ScanDashboardLinkProps) {
  if (variant === "icon") {
    return (
      <Link
        href="/dashboard"
        aria-label="Go to dashboard"
        className={cn(
          "grid size-10 place-items-center rounded-full border border-border bg-background/80 text-muted-foreground backdrop-blur-sm transition-colors hover:text-foreground active:scale-95",
          className,
        )}
      >
        <IconX className="size-4" />
      </Link>
    )
  }

  if (variant === "segment") {
    return (
      <Link
        href="/dashboard"
        className={cn(
          "relative z-10 inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md bg-transparent px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors outline-none hover:text-foreground",
          className,
        )}
      >
        <IconLayoutDashboard className="size-3.5" />
        Dashboard
      </Link>
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      asChild
      className={cn("bg-background/80 backdrop-blur-sm", className)}
    >
      <Link href="/dashboard">
        <IconLayoutDashboard className="size-4" />
        Dashboard
      </Link>
    </Button>
  )
}

/** @deprecated Use ScanDashboardLink */
export const ScanCloseButton = ScanDashboardLink
