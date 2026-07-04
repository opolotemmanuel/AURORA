"use client"

import Link from "next/link"
import { LayoutGroup, motion, useReducedMotion } from "motion/react"
import type { TablerIcon } from "@tabler/icons-react"

import { AnimatedBadge } from "@/components/motion/animated-badge"
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { EASE_OUT } from "@/lib/ease"

type SidebarNavItemProps = {
  href: string
  label: string
  icon: TablerIcon
  isActive: boolean
  badge?: string
}

export function SidebarNavItem({
  href,
  label,
  icon: Icon,
  isActive,
  badge,
}: SidebarNavItemProps) {
  const reduceMotion = useReducedMotion()

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive} tooltip={label}>
        <Link href={href}>
          <motion.span
            className="relative flex w-full items-center gap-2"
            whileHover={reduceMotion ? undefined : { x: 2 }}
            transition={{ duration: 0.15, ease: EASE_OUT }}
          >
            {isActive ? (
              <motion.span
                layoutId="sidebar-active-pill"
                className="absolute inset-0 -mx-1 rounded-lg bg-sidebar-accent"
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 170, damping: 24, mass: 1.1 }
                }
              />
            ) : null}
            <Icon className="relative z-10 size-4 shrink-0" />
            <span className="relative z-10 flex-1 truncate">{label}</span>
            {badge ? (
              <AnimatedBadge
                status="neutral"
                size="sm"
                className="relative z-10 shrink-0"
              >
                {badge}
              </AnimatedBadge>
            ) : null}
          </motion.span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

export function SidebarNavLayoutGroup({
  children,
}: {
  children: React.ReactNode
}) {
  return <LayoutGroup id="dashboard-sidebar-nav">{children}</LayoutGroup>
}
