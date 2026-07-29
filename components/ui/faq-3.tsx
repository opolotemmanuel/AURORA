"use client"

import { IconMinus, IconPlus } from "@tabler/icons-react"
import { motion, type Variants } from "motion/react"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { EASE_OUT } from "@/lib/ease"
import { cn } from "@/lib/utils"

export interface FAQItem {
  question: string
  answer: string
}

export interface FAQSectionProps {
  badge?: string
  heading: string
  subheading?: string
  items: FAQItem[]
  className?: string
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: EASE_OUT },
  },
}

export function FAQ3({
  badge = "Frequently asked questions",
  heading,
  subheading,
  items,
  className,
}: FAQSectionProps) {
  return (
    <section
      className={cn(
        "bg-background relative overflow-hidden py-28 md:py-36",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_40%_at_0%_20%,var(--primary)_0%,transparent_55%)] opacity-[0.05]"
        aria-hidden
      />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 lg:grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start lg:gap-16">
        <div className="flex w-full flex-col items-center text-center lg:sticky lg:top-28 lg:items-start lg:text-left">
          {badge ? (
            <p className="text-muted-foreground mb-3 text-sm font-medium tracking-wide uppercase">
              {badge}
            </p>
          ) : null}

          <h2 className="font-heading text-foreground text-3xl leading-tight font-medium tracking-tight text-balance md:text-4xl">
            {heading}
          </h2>

          {subheading ? (
            <p className="text-muted-foreground mt-4 max-w-sm text-sm leading-relaxed sm:text-base lg:max-w-md">
              {subheading}
            </p>
          ) : null}
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="w-full min-w-0"
        >
          <Accordion type="single" collapsible className="flex w-full flex-col gap-3">
            {items.map((item, i) => {
              const num = String(i + 1).padStart(2, "0")
              return (
                <motion.div key={item.question} variants={itemVariants}>
                  <AccordionItem
                    value={`item-${i}`}
                    className="border-border/60 bg-card/50 group overflow-hidden rounded-xl border shadow-sm transition-colors duration-300 data-[state=open]:border-primary/30 data-[state=open]:bg-card data-[state=open]:shadow-md"
                  >
                    <AccordionTrigger
                      className={cn(
                        "flex w-full items-center gap-4 rounded-none px-5 py-4 hover:no-underline sm:px-5 sm:py-4",
                        "[&_[data-slot=accordion-trigger-icon]]:!hidden",
                        "focus-visible:ring-0 focus-visible:border-transparent",
                      )}
                    >
                      <span className="text-primary/50 group-data-[state=open]:text-primary w-7 shrink-0 font-mono text-xs font-medium tracking-wider tabular-nums transition-colors">
                        {num}
                      </span>

                      <span className="text-foreground flex-1 text-left text-sm leading-snug font-medium sm:text-[15px]">
                        {item.question}
                      </span>

                      <span className="bg-muted text-muted-foreground group-data-[state=open]:bg-primary/12 group-data-[state=open]:text-primary flex size-8 shrink-0 items-center justify-center rounded-full transition-colors duration-300">
                        <IconPlus className="size-3.5 group-data-[state=open]:hidden" />
                        <IconMinus className="hidden size-3.5 group-data-[state=open]:block" />
                      </span>
                    </AccordionTrigger>

                    <AccordionContent className="px-5 pt-0 pb-5 pl-[3.25rem] sm:pl-[3.75rem] sm:pr-5">
                      <p className="text-muted-foreground max-w-prose text-sm leading-relaxed">
                        {item.answer}
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                </motion.div>
              )
            })}
          </Accordion>
        </motion.div>
      </div>
    </section>
  )
}
