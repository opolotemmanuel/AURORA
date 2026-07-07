"use client"

import Image from "next/image"
import Link from "next/link"
import { motion, type Variants } from "motion/react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { EASE_OUT } from "@/lib/ease"
import { PLACEHOLDER_IMAGES } from "@/lib/marketing/placeholder-images"
import {
  HERO_TRUST_AVATAR_COUNT,
  HERO_TRUST_LABEL,
  TESTIMONIALS,
} from "@/lib/marketing/testimonials"

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
      <div className="text-primary absolute inset-0 bg-[radial-gradient(circle,currentColor_1px,transparent_1px)] bg-size-[24px_24px] opacity-[0.16] mask-[radial-gradient(ellipse_75%_65%_at_50%_55%,black,transparent)] dark:opacity-[0.10] md:mask-[radial-gradient(ellipse_60%_70%_at_72%_50%,black,transparent)]" />
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
            Your best skin starts here. In seconds, one scan gives you a
            profile, matched products, and a routine made for you.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="grid w-full grid-cols-1 gap-3 sm:w-fit sm:grid-cols-2"
          >
            <Button asChild size="lg" className="w-full">
              <Link href="/scan">Start your scan</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="flex flex-col items-center gap-2.5 sm:flex-row sm:items-center md:items-start"
          >
            <div className="flex shrink-0 -space-x-2">
              {TESTIMONIALS.slice(0, HERO_TRUST_AVATAR_COUNT).map(
                (testimonial) => (
                  <Avatar
                    key={testimonial.name}
                    className="ring-background size-9 ring-2"
                  >
                    <AvatarImage
                      src={testimonial.avatar}
                      alt={testimonial.name}
                    />
                    <AvatarFallback>
                      {testimonial.name
                        .split(" ")
                        .map((part) => part[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                ),
              )}
            </div>
            <p className="text-muted-foreground max-w-[13rem] text-center text-sm leading-snug text-balance sm:max-w-[15rem] sm:text-left md:max-w-[17rem]">
              {HERO_TRUST_LABEL}
            </p>
          </motion.div>
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
