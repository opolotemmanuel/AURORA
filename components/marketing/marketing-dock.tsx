"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react"
import {
  IconCamera,
  IconHelp,
  IconHome,
  IconMoon,
  IconRoute,
  IconSparkles,
  IconSun,
} from "@tabler/icons-react"
import { motion, useReducedMotion } from "motion/react"
import { useTheme } from "next-themes"

import { DockItem, DockSeparator } from "@/components/motion/dock"
import { Tooltip } from "@/components/motion/tooltip"
import { SPRING_LAYOUT } from "@/lib/ease"
import { cn } from "@/lib/utils"

const SECTIONS = [
  { id: "top", label: "Home", icon: IconHome },
  { id: "benefits", label: "Benefits", icon: IconSparkles },
  { id: "how-it-works", label: "How it works", icon: IconRoute },
  { id: "faq", label: "FAQ", icon: IconHelp },
] as const

type SectionId = (typeof SECTIONS)[number]["id"]

const SCROLL_DELTA_THRESHOLD = 8
const COLLAPSE_AFTER_Y = 80
const ITEM_SIZE_EXPANDED = 44
const ITEM_SIZE_COLLAPSED = 24

function scrollToSection(id: SectionId) {
  const element = document.getElementById(id)
  if (element) {
    element.scrollIntoView({ behavior: "smooth", block: "start" })
  }
}

function DockThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

  const isDark = resolvedTheme === "dark"
  const label = isDark ? "Light mode" : "Dark mode"
  const toggle = () => setTheme(isDark ? "light" : "dark")

  if (!mounted) {
    return (
      <Tooltip
        content="Theme"
        side="top"
        wrapperClassName="size-full flex items-center justify-center"
      >
        <DockItem aria-label="Theme">
          <span className="size-5" aria-hidden />
        </DockItem>
      </Tooltip>
    )
  }

  return (
    <Tooltip
      content={label}
      side="top"
      wrapperClassName="size-full flex items-center justify-center"
    >
      <DockItem aria-label={label} onClick={toggle}>
        {isDark ? (
          <IconSun className="size-5" aria-hidden />
        ) : (
          <IconMoon className="size-5" aria-hidden />
        )}
      </DockItem>
    </Tooltip>
  )
}

export function MarketingDock() {
  const pathname = usePathname()
  const router = useRouter()
  const isLanding = pathname === "/"
  const [activeSection, setActiveSection] = useState<SectionId>("top")
  const [collapsed, setCollapsed] = useState(false)
  const pillLayoutId = useId()
  const reduce = useReducedMotion()
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

        if (y <= COLLAPSE_AFTER_Y) {
          setCollapsed(false)
        } else if (delta > SCROLL_DELTA_THRESHOLD) {
          setCollapsed(true)
        } else if (delta < -SCROLL_DELTA_THRESHOLD) {
          setCollapsed(false)
        }

        lastScrollY.current = y
        ticking = false
      })
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const observeSections = useCallback(() => {
    if (!isLanding) return

    const elements = SECTIONS.map(({ id }) => document.getElementById(id)).filter(
      Boolean,
    ) as HTMLElement[]

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
    if (isLanding) {
      scrollToSection(id)
      return
    }
    router.push(`/#${id}`)
  }

  const spring = reduce ? { duration: 0 } : SPRING_LAYOUT

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center">
      <motion.div
        layout
        transition={spring}
        className={cn(
          "border-border bg-card/80 pointer-events-auto inline-flex items-center overflow-visible border shadow-2xl backdrop-blur-xl",
          collapsed ? "rounded-full" : "rounded-2xl",
        )}
      >
        <motion.div
          layout
          transition={spring}
          className={cn(
            "flex items-center",
            collapsed ? "gap-2 px-3 py-0" : "gap-1.5 px-2 py-1",
          )}
        >
          {SECTIONS.map(({ id, label, icon: Icon }) => {
            const isActive = isLanding && activeSection === id

            return (
              <motion.div
                key={id}
                layout
                transition={spring}
                animate={{
                  width: collapsed ? ITEM_SIZE_COLLAPSED : ITEM_SIZE_EXPANDED,
                  height: collapsed ? ITEM_SIZE_COLLAPSED : ITEM_SIZE_EXPANDED,
                }}
                className="relative flex shrink-0 items-center justify-center"
              >
                <motion.button
                  type="button"
                  aria-label="Expand dock"
                  onClick={() => setCollapsed(false)}
                  animate={{
                    opacity: collapsed ? 1 : 0,
                    scale: collapsed ? 1 : 0.6,
                  }}
                  transition={spring}
                  className={cn(
                    "absolute inset-0 flex items-center justify-center rounded-full outline-none",
                    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    collapsed ? "pointer-events-auto" : "pointer-events-none",
                  )}
                >
                  {isActive ? (
                    <motion.span
                      layoutId={pillLayoutId}
                      transition={spring}
                      className="bg-primary absolute inset-1 rounded-full"
                    />
                  ) : null}
                  <span
                    className={cn(
                      "relative z-10 size-1.5 rounded-full",
                      isActive
                        ? "bg-primary-foreground"
                        : "bg-muted-foreground/50",
                    )}
                  />
                </motion.button>

                <motion.div
                  animate={{
                    opacity: collapsed ? 0 : 1,
                    scale: collapsed ? 0.6 : 1,
                  }}
                  transition={spring}
                  className={cn(
                    "absolute inset-0 flex items-center justify-center",
                    collapsed ? "pointer-events-none" : "pointer-events-auto",
                  )}
                >
                  <Tooltip
                    content={label}
                    side="top"
                    wrapperClassName="size-full flex items-center justify-center"
                  >
                    <DockItem
                      aria-label={label}
                      active={isActive}
                      onClick={() => handleSectionNav(id)}
                    >
                      <Icon className="size-5" aria-hidden />
                    </DockItem>
                  </Tooltip>
                </motion.div>
              </motion.div>
            )
          })}

          <motion.div
            layout
            transition={spring}
            initial={false}
            animate={{
              maxWidth: collapsed ? 0 : 200,
              opacity: collapsed ? 0 : 1,
              marginLeft: collapsed ? 0 : undefined,
            }}
            className="flex items-center overflow-visible"
            style={{ pointerEvents: collapsed ? "none" : "auto" }}
          >
            <DockSeparator />
            <DockThemeToggle />
            <Tooltip
              content="Start scan"
              side="top"
              wrapperClassName="size-full flex items-center justify-center"
            >
              <DockItem aria-label="Start scan">
                <Link
                  href="/scan"
                  className="text-foreground flex size-full items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <IconCamera className="size-5" aria-hidden />
                </Link>
              </DockItem>
            </Tooltip>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  )
}
