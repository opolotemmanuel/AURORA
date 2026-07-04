"use client"

import { AnimatePresence, motion } from "motion/react"

import { EASE_OUT } from "@/lib/ease"

type OnboardingStepPanelProps = {
  stepKey: string
  children: React.ReactNode
}

export function OnboardingStepPanel({
  stepKey,
  children,
}: OnboardingStepPanelProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={stepKey}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.24, ease: EASE_OUT }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

export function OnboardingStepItem({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
