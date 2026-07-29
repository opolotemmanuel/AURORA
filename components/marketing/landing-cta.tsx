"use client"

import Link from "next/link"
import { IconCheck, IconDownload, IconGift, IconLock } from "@tabler/icons-react"
import { motion, useReducedMotion, type Variants } from "motion/react"

import { FramedPanel } from "@/components/marketing/framed-panel"
import { Button } from "@/components/ui/button"
import { EASE_OUT } from "@/lib/ease"

const BANDS = [
  { label: "Hydration", value: "Balanced" },
  { label: "Tone", value: "Even" },
  { label: "Texture", value: "Smooth" },
] as const

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: EASE_OUT },
  },
}

function CtaPhone() {
  const reduceMotion = useReducedMotion()

  return (
    <div className="relative mx-auto w-full max-w-[280px]">
      {/* Soft glow behind phone */}
      <div
        className="bg-primary/20 pointer-events-none absolute top-1/2 left-1/2 size-56 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        aria-hidden
      />

      <motion.div
        className="border-border bg-background relative overflow-hidden rounded-[2rem] border-[6px] shadow-xl"
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: EASE_OUT }}
      >
        {/* Dynamic island */}
        <div className="bg-foreground/90 absolute top-2.5 left-1/2 z-20 h-5 w-20 -translate-x-1/2 rounded-full" />

        <div className="bg-muted/30 relative space-y-3 px-3.5 pt-11 pb-6">
          {/* Status / app header */}
          <div className="flex items-center justify-between px-0.5">
            <div>
              <p className="text-foreground text-sm font-semibold">Your report</p>
              <p className="text-muted-foreground text-[10px]">Just now</p>
            </div>
            <span className="bg-primary/12 text-primary rounded-md px-1.5 py-0.5 text-[10px] font-medium">
              PDF
            </span>
          </div>

          {/* Overall band */}
          <motion.div
            className="bg-card/80 border-border/60 rounded-xl border p-3 shadow-sm"
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.45, ease: EASE_OUT }}
          >
            <p className="text-muted-foreground text-[10px]">Overall</p>
            <p className="text-foreground mt-0.5 text-lg font-semibold">
              Balanced
              <span className="text-muted-foreground ml-1 text-xs font-normal">
                band
              </span>
            </p>
          </motion.div>

          {/* Dimension bands */}
          <div className="space-y-1.5">
            {BANDS.map((band, i) => (
              <motion.div
                key={band.label}
                className="bg-card/60 border-border/50 flex items-center justify-between rounded-lg border px-2.5 py-2"
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{
                  delay: reduceMotion ? 0 : 0.3 + i * 0.1,
                  duration: 0.4,
                  ease: EASE_OUT,
                }}
              >
                <span className="text-muted-foreground text-[11px]">
                  {band.label}
                </span>
                <span className="bg-primary/12 text-primary rounded-md px-1.5 py-0.5 text-[10px] font-medium">
                  {band.value}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Product match */}
          <motion.div
            className="bg-card/80 border-border/60 flex items-center gap-2.5 rounded-xl border p-2.5 shadow-sm"
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{
              delay: reduceMotion ? 0 : 0.65,
              duration: 0.45,
              ease: EASE_OUT,
            }}
          >
            <span className="bg-primary/20 size-9 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1">
              <p className="text-foreground truncate text-[11px] font-medium">
                Gentle daily serum
              </p>
              <p className="text-muted-foreground text-[10px]">
                Allergy-safe · Climate-aware
              </p>
            </div>
            <IconCheck className="text-primary size-3.5 shrink-0" aria-hidden />
          </motion.div>

          {/* Download cue */}
          <motion.div
            className="bg-primary/10 text-primary flex items-center justify-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-medium"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: reduceMotion ? 0 : 0.85, duration: 0.4 }}
          >
            <IconDownload className="size-3" aria-hidden />
            Download report
          </motion.div>
        </div>

        {/* Home indicator */}
        <div className="bg-foreground/20 absolute bottom-2 left-1/2 z-20 h-1 w-24 -translate-x-1/2 rounded-full" />
      </motion.div>
    </div>
  )
}

export function LandingCta() {
  return (
    <section
      aria-label="Start your scan"
      className="bg-muted/30 relative overflow-hidden py-28 md:py-36"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_100%,var(--primary)_0%,transparent_55%)] opacity-[0.06]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-6">
        <FramedPanel className="border-border/60 bg-muted/25 overflow-visible">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="bg-card/40 relative grid items-center gap-10 overflow-hidden px-6 py-12 sm:px-10 lg:grid-cols-2 lg:gap-12 lg:py-14 lg:pr-8"
          >
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_70%_at_100%_50%,var(--primary)_0%,transparent_55%)] opacity-[0.07]"
              aria-hidden
            />

            <div className="relative flex flex-col items-center gap-6 text-center lg:items-start lg:text-left">
              <motion.p
                variants={itemVariants}
                className="text-muted-foreground text-sm font-medium tracking-wide uppercase"
              >
                Start free
              </motion.p>

              <motion.h2
                variants={itemVariants}
                className="font-heading text-foreground max-w-md text-3xl leading-tight font-medium tracking-tight text-balance md:text-4xl"
              >
                Your skin report is one photo away
              </motion.h2>

              <motion.div variants={itemVariants}>
                <Button asChild size="lg">
                  <Link href="/scan">Start your free scan</Link>
                </Button>
              </motion.div>

              <motion.ul
                variants={itemVariants}
                className="text-muted-foreground flex flex-col items-center gap-2 text-sm sm:flex-row sm:gap-x-5 lg:items-start"
              >
                <li className="flex items-center gap-2">
                  <IconGift
                    className="text-primary size-4 shrink-0"
                    aria-hidden
                  />
                  Three free scans, no card
                </li>
                <li className="flex items-center gap-2">
                  <IconLock
                    className="text-primary size-4 shrink-0"
                    aria-hidden
                  />
                  Photo never stored
                </li>
              </motion.ul>
            </div>

            <motion.div
              variants={itemVariants}
              className="relative flex justify-center lg:justify-end"
            >
              <CtaPhone />
            </motion.div>
          </motion.div>
        </FramedPanel>
      </div>
    </section>
  )
}
