"use client"

import Link from "next/link"

import { FramedPanel } from "@/components/marketing/framed-panel"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export function Features3() {
  return (
    <section className="bg-muted/30 w-full py-20">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="text-muted-foreground bg-muted/50 inline-flex w-fit items-center gap-2 rounded-lg px-3 py-1 text-sm">
            <span className="bg-primary h-2 w-2 rounded-full" />
            Why it works
          </div>

          <h2 className="font-heading text-foreground text-3xl leading-tight font-medium tracking-tight text-balance md:text-4xl">
            Skincare guidance that actually fits you
          </h2>

          <p className="text-muted-foreground max-w-lg">
            No more trial and error at the shelf. One scan reads your skin across
            six dimensions, explains each in plain language, and matches you to
            Aurora Organics formulas that suit your goals, your routine, your
            climate, and the ingredients you need to avoid.
          </p>

          <div className="space-y-2">
            {[
              "Upload a photo, use your camera, or run a live real-time scan",
              "Six skin dimensions in plain-language bands, plus an Ayurvedic skin lean",
              "Matches filtered against your allergy list and your local climate",
              "Keep the PDF report and ask follow-ups; your photo is never stored",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <div className="bg-primary/10 mt-1 flex size-6 items-center justify-center rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)]">
                  <div className="bg-primary h-2.5 w-2.5 rounded-full" />
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {item}
                </p>
              </div>
            ))}
          </div>

          <Button
            asChild
            className="rounded-sm px-6 shadow-[inset_0_0px_2px_0px_rgba(0,0,0,0.1),inset_0_0px_4px_0px_rgba(0,0,0,0.1)]"
          >
            <Link href="/scan">Start your free scan</Link>
          </Button>
        </div>

        <FramedPanel innerClassName="flex justify-center p-8">
          <div className="relative h-[380px] w-full max-w-md">
            <Card className="bg-background/80 dark:bg-card/80 ring-border/50 absolute top-0 left-0 w-[260px] rounded-lg p-0 shadow-md backdrop-blur-md">
              <CardContent className="space-y-2 p-4">
                <div className="text-muted-foreground text-xs">
                  Skin balance
                </div>
                <div className="text-2xl font-semibold">
                  Balanced
                  <span className="text-muted-foreground text-sm"> band</span>
                </div>
                <div className="flex gap-2 text-[10px]">
                  <span className="bg-primary/15 text-primary rounded-md px-2 py-0.5">
                    Hydration
                  </span>
                  <span className="bg-muted text-muted-foreground rounded-md px-2 py-0.5">
                    Texture
                  </span>
                </div>
                <div className="text-muted-foreground space-y-1 text-xs">
                  <div>Even tone: moderate</div>
                  <div>Barrier support: good</div>
                  <div>Routine fit: high</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-background/90 dark:bg-card/80 ring-border/50 absolute top-28 right-0 z-50 w-[240px] rounded-lg p-0 shadow-lg backdrop-blur-md">
              <CardContent className="space-y-3 p-4">
                <div className="text-muted-foreground text-xs">
                  Scan quality
                </div>
                <div className="text-muted-foreground text-sm">
                  <span className="text-foreground font-medium">
                    Lighting &amp; framing
                  </span>{" "}
                  passed
                </div>
                <div className="flex h-2 w-full gap-1">
                  <div className="bg-primary w-[40%] rounded-full" />
                  <div className="bg-primary/60 w-[35%] rounded-full" />
                  <div className="bg-primary/30 w-[25%] rounded-full" />
                </div>
                <div className="text-muted-foreground flex gap-3 text-[10px]">
                  <span className="flex items-center gap-1">
                    <span className="bg-primary h-2 w-2 rounded-full" />
                    Face
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="bg-primary/60 h-2 w-2 rounded-full" />
                    Light
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="bg-primary/30 h-2 w-2 rounded-full" />
                    Steady
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-background/90 dark:bg-card/80 ring-border/50 absolute bottom-8 left-10 w-[260px] rounded-lg p-0 shadow-lg backdrop-blur-md">
              <CardContent className="space-y-3 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Top match</span>
                  <span className="text-muted-foreground text-xs">Aurora</span>
                </div>
                <div className="text-muted-foreground text-sm">
                  <span className="text-foreground font-medium">
                    Gentle daily serum
                  </span>{" "}
                  recommended
                </div>
                <div className="flex gap-2 text-[10px]">
                  <span className="bg-primary/15 text-primary rounded-md px-2 py-0.5">
                    Routine
                  </span>
                  <span className="bg-muted text-muted-foreground rounded-md px-2 py-0.5">
                    Climate-aware
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </FramedPanel>
      </div>
    </section>
  )
}
