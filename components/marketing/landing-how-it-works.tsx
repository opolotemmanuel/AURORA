"use client"

import type { ComponentType } from "react"
import { IconArrowRight } from "@tabler/icons-react"
import { motion, type Variants } from "motion/react"

import { FramedPanel } from "@/components/marketing/framed-panel"
import {
  AssessVisual,
  ReportVisual,
  ScanVisual,
} from "@/components/marketing/how-it-works-visuals"
import { EASE_OUT } from "@/lib/ease"

type Step = {
  number: string
  title: string
  description: string
  Visual: ComponentType
}

const steps: Step[] = [
  {
    number: "1",
    title: "Take a photo",
    description: "Snap once. We check lighting on your device first.",
    Visual: ScanVisual,
  },
  {
    number: "2",
    title: "See your skin read",
    description: "Clear bands for hydration, tone, texture, and more.",
    Visual: AssessVisual,
  },
  {
    number: "3",
    title: "Get your report",
    description: "Keep the PDF with Aurora matches made for you.",
    Visual: ReportVisual,
  },
]

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.16 },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: EASE_OUT },
  },
}

export function LandingHowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-label="How it works"
      className="bg-background relative overflow-hidden py-28 md:py-36"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,var(--primary)_0%,transparent_55%)] opacity-[0.05]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="mb-12 text-center">
          <p className="text-muted-foreground mb-3 text-sm font-medium tracking-wide uppercase">
            How it works
          </p>
          <h2 className="font-heading text-foreground text-3xl leading-tight font-medium tracking-tight text-balance md:text-4xl">
            Three steps to your report
          </h2>
        </div>

        {/* Clear horizontal flow label on desktop */}
        <div
          className="text-muted-foreground mb-8 hidden items-center justify-center gap-3 text-sm md:flex"
          aria-hidden
        >
          <span>Photo</span>
          <IconArrowRight className="size-4 opacity-50" />
          <span>Skin read</span>
          <IconArrowRight className="size-4 opacity-50" />
          <span>Report</span>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="relative grid gap-6 md:grid-cols-3 md:gap-5"
        >
          {steps.map((step) => {
            const Visual = step.Visual

            return (
              <motion.div
                key={step.title}
                variants={itemVariants}
                className="relative"
              >
                <FramedPanel className="border-border/60 bg-muted/25 h-full">
                  <div className="bg-card/50 flex h-full flex-col gap-4 p-3 sm:p-4">
                    <Visual />

                    <div className="space-y-2.5 px-2 pb-3 sm:px-3 sm:pb-4">
                      <div className="flex items-center gap-2.5">
                        <span className="bg-primary text-primary-foreground flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                          {step.number}
                        </span>
                        <h3 className="font-heading text-foreground text-lg font-semibold">
                          {step.title}
                        </h3>
                      </div>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </FramedPanel>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
