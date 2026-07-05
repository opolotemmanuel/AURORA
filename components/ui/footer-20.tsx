"use client"

import Image from "next/image"
import Link from "next/link"
import { IconArrowUpRight } from "@tabler/icons-react"
import { motion, type Variants } from "motion/react"

import brandIcon from "@/app/icon.png"

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
}

const riseItem: Variants = {
  hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring", duration: 0.6, bounce: 0 },
  },
}

const giantTextVariant: Variants = {
  hidden: { opacity: 0, y: 30, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring", duration: 0.8, bounce: 0 },
  },
}

export interface Footer20Props {
  brandName?: string
  description?: string
  email?: string
  links?: {
    good: { label: string; href: string }[]
    boring: { label: string; href: string }[]
    cool: { label: string; href: string }[]
  }
}

export function Footer20({
  brandName = "Aurora Organics",
  description = "Thoughtful skincare, made personal. Aura brings Aurora Organics expertise to your screen — clear cosmetic insights, routines tailored to you, and product guidance you can trust. Wellness guidance only; not a medical diagnosis.",
  email = "hello@auroraorganics.com",
  links = {
    good: [
      { label: "Home", href: "/" },
      { label: "Start scan", href: "/scan" },
      { label: "Sign in", href: "/login" },
      { label: "Sign up", href: "/signup" },
    ],
    boring: [
      { label: "Terms of use", href: "/terms" },
      { label: "Privacy policy", href: "/privacy" },
      { label: "Data deletion", href: "/privacy/data-deletion" },
      { label: "Help", href: "/help" },
    ],
    cool: [
      { label: "Aurora Organics", href: "/" },
    ],
  },
}: Footer20Props) {
  return (
    <motion.footer
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      className="bg-muted/30 text-muted-foreground relative flex w-full flex-col justify-between overflow-hidden border-t border-border font-sans transition-colors duration-300"
    >
      <div className="border-border relative z-10 mx-auto flex w-full max-w-[1400px] flex-col border-x border-dashed px-6 pt-20 md:px-12 md:pt-32 lg:px-16">
        <div className="mb-10 grid grid-cols-1 gap-16 md:mb-16 lg:mb-24 lg:grid-cols-12 lg:gap-8">
          <motion.div
            variants={riseItem}
            className="flex flex-col gap-6 md:gap-8 lg:col-span-5 xl:col-span-4"
          >
            <div className="text-foreground flex items-center gap-2.5">
              <Image
                src={brandIcon}
                alt=""
                width={32}
                height={32}
                className="size-8 shrink-0 rounded-lg"
                style={{ width: "auto", height: "auto" }}
              />
              <span className="font-heading mt-0.5 text-lg font-medium tracking-wide">
                {brandName}
              </span>
            </div>
            <p className="max-w-[320px] text-[15px] leading-relaxed">
              {description}
            </p>
            <a
              href={`mailto:${email}`}
              className="text-foreground group mt-2 inline-flex items-center gap-2 text-[17px] transition-colors hover:text-primary"
            >
              {email}
              <IconArrowUpRight
                className="size-[18px] transition-colors group-hover:text-primary"
                aria-hidden
              />
            </a>
          </motion.div>

          <div className="grid grid-cols-2 gap-12 sm:grid-cols-3 lg:col-span-7 lg:gap-8 xl:col-span-8">
            <motion.div variants={riseItem} className="flex flex-col gap-6">
              <h4 className="text-foreground font-medium">Product</h4>
              <ul className="flex flex-col gap-3">
                {links.good.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-[15px] transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div variants={riseItem} className="flex flex-col gap-6">
              <h4 className="text-foreground font-medium">Legal</h4>
              <ul className="flex flex-col gap-3">
                {links.boring.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-[15px] transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div variants={riseItem} className="flex flex-col gap-6">
              <h4 className="text-foreground font-medium">Company</h4>
              <ul className="flex flex-col gap-3">
                {links.cool.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-[15px] transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>

        <motion.div
          variants={giantTextVariant}
          className="flex w-full justify-center pb-0 md:mt-auto"
        >
          <span
            aria-hidden
            className="font-display text-primary/15 pointer-events-none w-full select-none text-center text-[clamp(3rem,18vw,9rem)] leading-none tracking-tighter"
          >
            {brandName}
          </span>
        </motion.div>
      </div>
    </motion.footer>
  )
}
