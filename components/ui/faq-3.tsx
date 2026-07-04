"use client"

import { IconMinus, IconPlus } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQSectionProps {
  badge?: string;
  heading: string;
  subheading: string;
  items: FAQItem[];
}

export function FAQ3({
  badge = "Frequently asked questions",
  heading,
  subheading,
  items,
}: FAQSectionProps) {
  return (
    <section className="bg-background flex w-full flex-col items-center justify-center px-4 py-24 sm:py-32 md:py-36">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 lg:grid lg:grid-cols-2 lg:items-start lg:gap-16">
        {/* ── Header ── */}
        <div className="flex w-full flex-col items-center text-center lg:sticky lg:top-28 lg:items-start lg:text-left">
          {badge && (
            <Badge
              variant="outline"
              className="border-border bg-background text-muted-foreground mb-5 gap-1.5 rounded-full px-3 py-1 text-xs font-medium tracking-wide"
            >
              <span className="bg-primary inline-block h-2 w-2 rounded-full" />
              {badge}
            </Badge>
          )}

          <h2 className="text-foreground mb-4 text-4xl leading-tight font-bold tracking-tight text-balance sm:text-5xl">
            {heading}
          </h2>

          <p className="text-muted-foreground max-w-sm text-sm leading-relaxed sm:text-base lg:max-w-md">
            {subheading}
          </p>
        </div>

        <div className="w-full min-w-0">
          <Accordion type="single" collapsible className="flex w-full flex-col">
          {items.map((item, i) => {
            const num = String(i + 1).padStart(2, "0");
            return (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="group border-border bg-muted/30 hover:border-border/80 hover:bg-muted/50 data-[state=open]:border-border/80 from-primary/70 to-primary/50 overflow-hidden border transition-all duration-300 data-[state=open]:bg-gradient-to-r data-[state=open]:shadow-sm"
              >
                <AccordionTrigger className="flex w-full items-center gap-4 px-5 py-5 hover:no-underline sm:px-7 sm:py-3 [&_[data-slot=accordion-trigger-icon]]:!hidden">
                  <span className="text-muted-foreground/50 group-hover:text-muted-foreground group-data-[state=open]:text-muted w-8 shrink-0 text-center text-xs font-semibold tracking-widest tabular-nums transition-colors duration-200">
                    {num}
                  </span>

                  <span className="text-muted-foreground group-hover:text-foreground group-data-[state=open]:text-muted flex-1 text-left text-sm leading-snug font-medium transition-colors duration-200 sm:text-base">
                    {item.question}
                  </span>

                  <span className="group-hover:text-foreground group-data-[state=open]:text-muted flex h-7 w-7 shrink-0 items-center justify-center transition-all duration-300">
                    <IconPlus className="block size-3 group-data-[state=open]:hidden" />
                    <IconMinus className="hidden size-3 group-data-[state=open]:block" />
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-5 pt-0 pb-5 pl-[4.25rem] sm:px-7 sm:pb-6">
                  <p className="text-foreground text-sm leading-relaxed sm:text-base">
                    {item.answer}
                  </p>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
        </div>
      </div>
    </section>
  );
}
