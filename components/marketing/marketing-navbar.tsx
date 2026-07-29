"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react"
import { IconMenu2, IconMoon, IconSun } from "@tabler/icons-react"
import { useTheme } from "next-themes"

import brandIcon from "@/app/icon.png"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  SECTIONS,
  scrollToSection,
  type SectionId,
} from "@/lib/marketing/sections"
import { cn } from "@/lib/utils"

/** Ignore sub-pixel and momentum jitter so the bar does not flicker mid-scroll. */
const SCROLL_DELTA_THRESHOLD = 8
/** Keep the bar pinned over the top of the page, where hiding it feels abrupt. */
const REVEAL_ABOVE_Y = 80

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

  if (!mounted) {
    return <Button variant="ghost" size="icon" aria-label="Theme" disabled />
  }

  const isDark = resolvedTheme === "dark"

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={isDark ? "Light mode" : "Dark mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? (
        <IconSun className="size-5" aria-hidden />
      ) : (
        <IconMoon className="size-5" aria-hidden />
      )}
    </Button>
  )
}

export function MarketingNavbar() {
  const pathname = usePathname()
  const router = useRouter()
  const isLanding = pathname === "/"
  const [activeSection, setActiveSection] = useState<SectionId>("top")
  const [hidden, setHidden] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const lastScrollY = useRef(0)

  useEffect(() => {
    let ticking = false
    lastScrollY.current = window.scrollY

    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const y = window.scrollY
        const delta = y - lastScrollY.current

        setScrolled(y > 8)

        if (y <= REVEAL_ABOVE_Y) {
          setHidden(false)
        } else if (delta > SCROLL_DELTA_THRESHOLD) {
          setHidden(true)
        } else if (delta < -SCROLL_DELTA_THRESHOLD) {
          setHidden(false)
        }

        lastScrollY.current = y
        ticking = false
      })
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // An open menu must not be able to scroll itself out of view.
  const handleMenuOpenChange = (open: boolean) => {
    setMenuOpen(open)
    if (open) setHidden(false)
  }

  const observeSections = useCallback(() => {
    if (!isLanding) return

    const elements = SECTIONS.map(({ id }) =>
      document.getElementById(id),
    ).filter(Boolean) as HTMLElement[]

    if (elements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)

        if (visible[0]?.target.id) {
          setActiveSection(visible[0].target.id as SectionId)
        }
      },
      {
        rootMargin: "-40% 0px -45% 0px",
        threshold: [0, 0.25, 0.5, 0.75, 1],
      },
    )

    for (const element of elements) {
      observer.observe(element)
    }

    return () => observer.disconnect()
  }, [isLanding])

  useEffect(() => {
    return observeSections()
  }, [observeSections])

  const handleSectionNav = (id: SectionId) => {
    setMenuOpen(false)

    if (!scrollToSection(id)) {
      router.push(`/#${id}`)
    }
  }

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-transform duration-300 ease-out motion-reduce:transition-none",
        hidden ? "-translate-y-full" : "translate-y-0",
      )}
    >
      <div
        className={cn(
          "border-b transition-colors duration-300",
          scrolled
            ? "border-border bg-background/80 backdrop-blur-xl"
            : "border-transparent bg-transparent",
        )}
      >
        <nav
          aria-label="Main"
          className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6"
        >
          <Link
            href="/"
            className="text-foreground flex min-w-0 shrink items-center gap-2.5 transition-colors hover:text-muted-foreground"
          >
            <Image
              src={brandIcon}
              alt=""
              width={32}
              height={32}
              className="size-7 shrink-0 rounded-md"
              style={{ width: "auto", height: "auto" }}
            />
            <span className="font-heading truncate text-sm font-medium tracking-wide">
              Aurora Organics
            </span>
          </Link>

          <ul className="hidden items-center gap-1 md:flex">
            {SECTIONS.map(({ id, label }) => {
              const isActive = isLanding && activeSection === id

              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => handleSectionNav(id)}
                    aria-current={isActive ? "true" : undefined}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-sm transition-colors outline-none",
                      "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      isActive
                        ? "text-foreground bg-muted"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {label}
                  </button>
                </li>
              )
            })}
          </ul>

          <div className="flex shrink-0 items-center gap-1">
            <ThemeToggle />

            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link href="/scan">Start free scan</Link>
            </Button>

            <Sheet open={menuOpen} onOpenChange={handleMenuOpenChange}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Open menu"
                  className="md:hidden"
                >
                  <IconMenu2 className="size-5" aria-hidden />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <nav aria-label="Mobile" className="flex flex-col gap-1 px-4">
                  {SECTIONS.map(({ id, label }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => handleSectionNav(id)}
                      className={cn(
                        "rounded-md px-3 py-2 text-left text-sm transition-colors outline-none",
                        "focus-visible:ring-2 focus-visible:ring-ring",
                        isLanding && activeSection === id
                          ? "text-foreground bg-muted"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                  <SheetClose asChild>
                    <Button asChild className="mt-3">
                      <Link href="/scan">Start free scan</Link>
                    </Button>
                  </SheetClose>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </div>
    </header>
  )
}
