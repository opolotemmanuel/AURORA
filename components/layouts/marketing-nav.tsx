import Link from "next/link"

import { Button } from "@/components/ui/button"


export function MarketingNav() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="font-heading text-sm font-medium tracking-wide">
          Aura
        </Link>
        <nav className="flex items-center gap-6">
         
          <Button asChild size="sm">
            <Link href="/scan">Start scan</Link>
          </Button>
        </nav>
      </div>
    </header>
  )
}
