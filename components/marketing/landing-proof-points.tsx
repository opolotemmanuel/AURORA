"use client"

import type { ComponentType } from "react"
import { motion, type Variants } from "motion/react"

import { FramedPanel } from "@/components/marketing/framed-panel"
import {
  AllergyVisual,
  BandsVisual,
  ChatVisual,
  ClimateVisual,
  LeanVisual,
  PrivacyVisual,
} from "@/components/marketing/proof-point-visuals"
import { EASE_OUT } from "@/lib/ease"
import {
  PROOF_POINTS,
  PROOF_SECTION,
  type ProofVisualId,
} from "@/lib/marketing/proof-points"

const VISUALS: Record<ProofVisualId, ComponentType> = {
  bands: BandsVisual,
  lean: LeanVisual,
  allergy: AllergyVisual,
  climate: ClimateVisual,
  privacy: PrivacyVisual,
  chat: ChatVisual,
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE_OUT },
  },
}

export function LandingProofPoints() {
  return (
    <section
      id="what-you-get"
      aria-label="What you get"
      className="bg-muted/30 relative overflow-hidden py-28 md:py-36"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_100%,var(--primary)_0%,transparent_55%)] opacity-[0.04]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="mb-12 text-center">
          <p className="text-muted-foreground mb-3 text-sm font-medium tracking-wide uppercase">
            {PROOF_SECTION.badge}
          </p>
          <h2 className="font-heading text-foreground text-3xl leading-tight font-medium tracking-tight text-balance md:text-4xl">
            {PROOF_SECTION.heading}
          </h2>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {PROOF_POINTS.map((point) => {
            const Visual = VISUALS[point.visual]
            return (
              <motion.div key={point.title} variants={itemVariants}>
                <FramedPanel className="border-border/60 bg-muted/25 h-full">
                  <div className="bg-card/50 flex h-full flex-col gap-4 p-3 sm:p-4">
                    <Visual />

                    <div className="space-y-2 px-2 pb-3 sm:px-3 sm:pb-4">
                      <h3 className="font-heading text-foreground text-lg font-semibold">
                        {point.title}
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {point.description}
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
