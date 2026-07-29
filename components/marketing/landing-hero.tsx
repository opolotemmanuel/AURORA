"use client"

import Image from "next/image"
import Link from "next/link"
import { IconGift, IconLock } from "@tabler/icons-react"
import { motion, type Variants } from "motion/react"

import { Button } from "@/components/ui/button"
import { EASE_OUT } from "@/lib/ease"
import { scrollToSection } from "@/lib/marketing/sections"
import { PLACEHOLDER_IMAGES } from "@/lib/marketing/placeholder-images"

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.08,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: EASE_OUT },
  },
}

function HeroBackground() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,var(--primary)_0%,transparent_55%)] opacity-[0.08]" />
      {/* Same dot language as the scan flow (.dot-field), held at half strength
          so it registers as texture without competing with the headline. The
          mask falls off gently instead of clipping the field mid-section. */}
      <div className="dot-field absolute inset-0 opacity-50 mask-[radial-gradient(ellipse_110%_95%_at_50%_45%,black_35%,transparent_100%)] md:mask-[radial-gradient(ellipse_95%_105%_at_68%_50%,black_35%,transparent_100%)]" />
    </div>
  )
}

export function LandingHero() {
  return (
    <section
      id="top"
      aria-label="Hero"
      className="relative overflow-hidden bg-background"
    >
      <HeroBackground />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 md:grid-cols-2 md:py-28"
      >
        <div className="flex flex-col items-center gap-8 text-center md:items-start md:text-left">
          <motion.p
            variants={itemVariants}
            className="text-muted-foreground bg-muted/60 inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs sm:text-sm"
          >
            <span className="bg-primary size-1.5 rounded-full" />
            Skincare, made personal
          </motion.p>

          <motion.h1
            variants={itemVariants}
            className="font-display text-foreground max-w-xl text-4xl leading-[1.1] tracking-tight text-balance md:text-5xl lg:text-6xl"
          >
            Understand your skin.
            <br />
            Discover your routine.
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-muted-foreground max-w-lg text-base leading-relaxed md:text-lg"
          >
            One photo reads six dimensions of your skin, from hydration to tone
            and texture. You get an Ayurvedic skin lean, product matches
            filtered against your allergies and local climate, and a report you
            keep.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="grid w-full grid-cols-1 gap-3 sm:w-fit sm:grid-cols-2"
          >
            <Button asChild size="lg" className="w-full">
              <Link href="/scan">Start your free scan</Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() => scrollToSection("how-it-works")}
            >
              See how it works
            </Button>
          </motion.div>

          <motion.ul
            variants={itemVariants}
            className="text-muted-foreground flex flex-col items-center gap-2 text-sm sm:flex-row sm:gap-x-5"
          >
            <li className="flex items-center gap-2">
              <IconGift className="text-primary size-4 shrink-0" aria-hidden />
              Three free scans, no card required
            </li>
            <li className="flex items-center gap-2">
              <IconLock className="text-primary size-4 shrink-0" aria-hidden />
              Your photo is never stored
            </li>
          </motion.ul>
        </div>

        <motion.div
          variants={itemVariants}
          className="relative mx-auto w-full max-w-md md:mx-0 md:max-w-none"
        >
          <div className="border-border bg-muted/40 relative overflow-hidden rounded-2xl border p-3 shadow-sm">
            <div className="relative aspect-[4/5] overflow-hidden rounded-xl">
              <Image
                src={PLACEHOLDER_IMAGES.hero}
                alt="Personalized skincare routine, Aurora Organics wellness imagery"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}
