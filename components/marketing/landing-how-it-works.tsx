"use client"

import { IconBottle, IconCamera, IconSparkles } from "@tabler/icons-react"
import { motion, type Variants } from "motion/react"

import { Card, CardContent } from "@/components/ui/card"
import { EASE_OUT } from "@/lib/ease"

const steps = [
  {
    icon: IconCamera,
    title: "Scan",
    description:
      "Use your camera or upload a photo. On-device checks help ensure good lighting and framing before analysis.",
  },
  {
    icon: IconSparkles,
    title: "Assess",
    description:
      "Aura reviews your image and returns clear cosmetic wellness bands — hydration, tone, texture — in language you can actually use.",
  },
  {
    icon: IconBottle,
    title: "Recommend",
    description:
      "Discover Aurora Organics products matched to your profile, routine, and climate. Save and share your PDF report anytime.",
  },
]

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
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

export function LandingHowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-label="How it works"
      className="bg-background py-20"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12 text-center">
          <p className="text-muted-foreground mb-3 text-sm font-medium tracking-wide uppercase">
            How it works
          </p>
          <h2 className="font-heading text-foreground text-3xl font-semibold tracking-tight text-balance md:text-4xl">
            Your skin report in three simple steps
          </h2>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid gap-6 md:grid-cols-3"
        >
          {steps.map((step, index) => (
            <motion.div key={step.title} variants={itemVariants}>
              <Card className="bg-card h-full border-border">
                <CardContent className="space-y-4 p-6">
                  <div className="flex items-center gap-3">
                    <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
                      <step.icon className="size-5" aria-hidden />
                    </span>
                    <span className="text-muted-foreground text-sm font-medium">
                      Step {index + 1}
                    </span>
                  </div>
                  <h3 className="font-heading text-foreground text-lg font-semibold">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
