// Left panel of the split-screen (auth) shell (see
// components/layouts/auth-shell.tsx). Reuses the same photo and headline as
// the marketing hero (components/marketing/landing-page-content.tsx's
// HeroMockup/HeroSection) so the login experience reads as the same product,
// not a one-off design.
import Image from "next/image"

import { AuroraLogomark } from "@/components/brand/aurora-logomark"

// Fixed positions/delays (not random) so server and client render identically
// and the layout doesn't shift on hydration.
const particles = [
  { top: "18%", left: "22%", delay: "0s" },
  { top: "32%", left: "68%", delay: "1.2s" },
  { top: "54%", left: "38%", delay: "2.4s" },
  { top: "68%", left: "78%", delay: "0.6s" },
  { top: "78%", left: "16%", delay: "1.8s" },
]

export function HeroPanel() {
  return (
    <div className="relative min-h-56 overflow-hidden lg:min-h-full">
      <Image
        src="/Pasted image (3).png"
        alt="AI-analyzed portrait representing Aurora Organics' skin intelligence"
        fill
        priority
        sizes="(min-width: 1024px) 48vw, 100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-primary/15" />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 motion-reduce:hidden"
      >
        {particles.map((particle, index) => (
          <span
            key={index}
            className="animate-hero-float absolute size-1.5 rounded-full bg-primary-foreground/70"
            style={{
              top: particle.top,
              left: particle.left,
              animationDelay: particle.delay,
            }}
          />
        ))}
      </div>

      <div className="absolute inset-x-0 bottom-0 space-y-3 bg-background/90 p-6 backdrop-blur-sm lg:p-10">
        <div className="flex items-center gap-2">
          <AuroraLogomark />
          <span className="font-heading text-sm font-medium tracking-wide text-foreground">
            Aurora Organics
          </span>
        </div>
        <h2 className="font-display text-3xl font-semibold leading-tight text-foreground lg:text-4xl">
          AI Skin Intelligence
        </h2>
        <p className="max-w-sm text-sm text-muted-foreground lg:text-base">
          Understand your skin through intelligent, personalized AI analysis.
        </p>
      </div>
    </div>
  )
}
