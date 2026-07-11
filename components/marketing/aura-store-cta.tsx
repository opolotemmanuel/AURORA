import Link from "next/link"
import { IconSparkles } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"

type AuraStoreCtaProps = {
  className?: string
  compact?: boolean
}

export function AuraStoreCta({ className, compact = false }: AuraStoreCtaProps) {
  if (compact) {
    return (
      <Button asChild size="sm" className={className}>
        <Link href="/scan">
          <IconSparkles className="size-4" />
          Try Aura skin scan
        </Link>
      </Button>
    )
  }

  return (
    <div className={className}>
      <div className="rounded-none border border-border bg-card p-5 sm:p-6">
        <p className="font-heading text-lg font-medium">Aura skin intelligence</p>
        <p className="text-muted-foreground mt-2 text-sm">
          Get a cosmetic skin wellness report and personalized Aurora Organics
          product guidance from a quick photo scan.
        </p>
        <Button asChild className="mt-4">
          <Link href="/scan">
            <IconSparkles className="size-4" />
            Start your free scan
          </Link>
        </Button>
      </div>
    </div>
  )
}
