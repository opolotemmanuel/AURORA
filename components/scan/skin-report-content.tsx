"use client"

import { motion, useReducedMotion } from "motion/react"

import { BandBadge } from "@/components/scan/band-badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { EASE_OUT } from "@/lib/ease"
import { formatSkinHeadline } from "@/lib/scan/format"
import { getBandCardAccentClass } from "@/lib/scan/band-styles"
import type { SkinAssessment } from "@/lib/scan/types"
import { cn } from "@/lib/utils"

type SkinReportContentProps = {
  assessment: SkinAssessment
  className?: string
}

const STAGGER = 0.06

export function SkinReportContent({
  assessment,
  className,
}: SkinReportContentProps) {
  const reduceMotion = useReducedMotion()

  const fadeIn = (delay = 0) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 8 } as const,
          animate: { opacity: 1, y: 0 } as const,
          transition: { duration: 0.22, ease: EASE_OUT, delay },
        }

  return (
    <div className={cn("space-y-5", className)}>
      <motion.div {...fadeIn(0)}>
        <Card className="rounded-[1.5rem] outline-8 outline-card/40">
          <CardContent className="space-y-3">
            <BandBadge band={assessment.overallBand} size="md" />
            <p className="max-w-md text-balance text-lg text-foreground">
               {formatSkinHeadline(assessment.overallBand)}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground max-w-md">
              {assessment.summary}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <div className="space-y-2">
        <p className="font-heading text-sm font-semibold text-foreground">
          Dimensions
        </p>
        <div className="grid gap-2 md:grid-cols-2">
          {assessment.dimensions.map((dimension, index) => (
            <motion.div
              key={dimension.id}
              {...fadeIn(STAGGER * (index + 1))}
            >
              <Card
                size="sm"
                className={cn(
                  "border-l-4 ",
                  getBandCardAccentClass(dimension.band),
                )}
              >
                <CardHeader className="py-0">
                  <div className="flex justify-between items-center gap-2">
                  <div className="min-w-0 space-y-1">
                    <CardTitle className="text-sm font-medium normal-case tracking-normal text-foreground">
                      {dimension.label}
                    </CardTitle>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {dimension.note}
                    </p>
                  </div>
                    <BandBadge band={dimension.band} />
                  </div>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="font-heading text-sm font-semibold text-foreground">
          Aurora recommendations
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {assessment.recommendations.map((item, index) => (
            <motion.div
              key={item.id}
              {...fadeIn(STAGGER * (assessment.dimensions.length + index + 1))}
            >
              <Card size="sm" className="h-full ">
                <CardHeader>
                  <CardTitle className="text-base font-medium normal-case tracking-normal text-foreground">
                    {item.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {item.reason}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      <Card size="sm" className="bg-muted/30 ">
        <CardContent >
          <p className="text-xs leading-relaxed text-muted-foreground">
            {assessment.disclaimer}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
