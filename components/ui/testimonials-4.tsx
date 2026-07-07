"use client"

import { useEffect, useMemo, useState } from "react"
import Autoplay from "embla-carousel-autoplay"
import { IconQuote } from "@tabler/icons-react"

import { FramedPanel } from "@/components/marketing/framed-panel"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"
import type { Testimonial } from "@/lib/marketing/testimonials"
import { TESTIMONIALS } from "@/lib/marketing/testimonials"
import { cn } from "@/lib/utils"

export interface Testimonials4Props {
  badge?: string
  heading: string
  subheading: string
  testimonials?: Testimonial[]
  className?: string
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
}

export function Testimonials4({
  badge = "Social proof",
  heading,
  subheading,
  testimonials = TESTIMONIALS,
  className,
}: Testimonials4Props) {
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)")
    const onChange = () => setIsDesktop(mediaQuery.matches)

    onChange()
    mediaQuery.addEventListener("change", onChange)
    return () => mediaQuery.removeEventListener("change", onChange)
  }, [])

  const orientation = isDesktop ? "vertical" : "horizontal"

  const plugin = useMemo(
    () =>
      Autoplay({
        delay: 3500,
        stopOnInteraction: false,
        stopOnMouseEnter: true,
        playOnInit: true,
      }),
    [],
  )

  return (
    <section
      className={cn(
        "bg-muted/30 px-4 py-20 sm:py-28",
        className,
      )}
    >
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="flex flex-col justify-center gap-6">
          <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
            {badge}
          </p>
          <h2 className="font-heading text-foreground text-3xl leading-tight font-medium tracking-tight text-balance md:text-4xl">
            {heading}
          </h2>
          <p className="text-muted-foreground max-w-md text-base leading-relaxed sm:text-lg">
            {subheading}
          </p>
        </div>

        <div className="relative min-w-0">
          <Carousel
            key={orientation}
            orientation={orientation}
            opts={{
              loop: true,
              align: isDesktop ? "start" : "center",
              containScroll: false,
            }}
            plugins={[plugin]}
            onMouseEnter={plugin.stop}
            onMouseLeave={() => {
              plugin.reset()
              plugin.play()
            }}
            className={cn(
              "h-full w-full",
              isDesktop
                ? "[&_[data-slot=carousel-content]]:h-[500px] [&_[data-slot=carousel-content]]:[-webkit-mask-image:linear-gradient(to_bottom,transparent,black_12%,black_88%,transparent)] [&_[data-slot=carousel-content]]:[mask-image:linear-gradient(to_bottom,transparent,black_12%,black_88%,transparent)]"
                : "[&_[data-slot=carousel-content]]:[-webkit-mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)] [&_[data-slot=carousel-content]]:[mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]",
            )}
          >
          <CarouselContent>
            {testimonials.map((testimonial) => (
              <CarouselItem
                key={testimonial.name}
                className={cn(
                  isDesktop ? "basis-auto pt-4" : "basis-[88%] sm:basis-[72%]",
                )}
              >
                <FramedPanel>
                  <Card className="bg-card/60 h-[280px] border-0 shadow-none ring-0 sm:h-[300px]">
                    <CardContent className="flex h-full flex-col gap-6 p-6 sm:p-8">
                      <IconQuote
                        className="text-primary size-8 shrink-0 opacity-80"
                        aria-hidden
                      />
                      <p className="text-foreground flex-1 text-base leading-relaxed sm:text-lg">
                        &ldquo;{testimonial.content}&rdquo;
                      </p>
                      <div className="flex items-center gap-3">
                        <Avatar size="lg">
                          <AvatarImage
                            src={testimonial.avatar}
                            alt={testimonial.name}
                          />
                          <AvatarFallback>{initials(testimonial.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-foreground text-sm font-medium">
                            {testimonial.name}
                          </p>
                          <p className="text-muted-foreground text-sm">
                            {testimonial.role}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </FramedPanel>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
        </div>
      </div>
    </section>
  )
}
