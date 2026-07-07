import Link from "next/link"
import { IconLeaf } from "@tabler/icons-react"

import { AuthNavActions } from "@/components/auth/auth-nav-actions"

const navLinks = [
  { href: "#how-it-works", label: "How It Works" },
  { href: "#features", label: "Features" },
  { href: "#privacy", label: "Privacy" },
] as const

export function MarketingNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 shadow-sm backdrop-blur">
      <div className="mx-auto grid min-h-20 max-w-7xl grid-cols-[1fr_auto] items-center gap-4 px-4 py-3 sm:px-6 lg:grid-cols-[1fr_auto_1fr] lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-full border border-primary/30 text-primary">
            <IconLeaf className="size-7" />
          </span>
          <span className="font-display text-3xl font-semibold leading-none tracking-normal">
            Aurora SkinSense
          </span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="border-b-2 border-transparent py-2 text-sm font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-foreground first:border-primary first:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center justify-end gap-3">
          <AuthNavActions />
        </div>
      </div>
    </header>
  )
}
