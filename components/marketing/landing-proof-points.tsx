"use client"

import type { ComponentType } from "react"
import {
  IconCloud,
  IconFlask,
  IconLeaf,
  IconLock,
  IconMessageCircle,
  IconScan,
} from "@tabler/icons-react"
import { motion, type Variants } from "motion/react"

import { FramedPanel } from "@/components/marketing/framed-panel"
import { Card, CardContent } from "@/components/ui/card"
import { EASE_OUT } from "@/lib/ease"
import { PROOF_POINTS, PROOF_SECTION, type ProofPoint } from "@/lib/marketing/proof-points"

const ICONS: Record<ProofPoint["icon"], ComponentType<{ className?: string }>> = {
  scan: IconScan,
  leaf: IconLeaf,
  flask: IconFlask,
  cloud: IconCloud,
  lock: IconLock,
  message: IconMessageCircle,
  report: IconScan,
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
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
      className="bg-background py-20"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12 text-center">
          <p className="text-muted-foreground mb-3 text-sm font-medium tracking-wide uppercase">
            {PROOF_SECTION.badge}
          </p>
          <h2 className="font-heading text-foreground text-3xl leading-tight font-medium tracking-tight text-balance md:text-4xl">
            {PROOF_SECTION.heading}
          </h2>
          <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-base leading-relaxed text-balance">
            {PROOF_SECTION.subheading}
          </p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {PROOF_POINTS.map((point) => {
            const Icon = ICONS[point.icon]
            return (
              <motion.div key={point.title} variants={itemVariants}>
                <FramedPanel className="h-full">
                  <Card className="bg-card h-full border-0 shadow-none ring-0">
                    <CardContent className="space-y-4 p-6">
                      <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
                        <Icon className="size-5" aria-hidden />
                      </span>
                      <h3 className="font-heading text-foreground text-lg font-semibold">
                        {point.title}
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {point.description}
                      </p>
                    </CardContent>
                  </Card>
                </FramedPanel>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
