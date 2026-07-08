import Image from "next/image"
import Link from "next/link"
import {
  IconBrain,
  IconCamera,
  IconChartAreaLine,
  IconCheck,
  IconChevronLeft,
  IconClipboardText,
  IconCloud,
  IconDeviceMobile,
  IconDownload,
  IconFileTypePdf,
  IconFileAnalytics,
  IconFlask,
  IconLeaf,
  IconLock,
  IconMicroscope,
  IconReportAnalytics,
  IconRosetteDiscountCheck,
  IconShieldCheck,
  IconSparkles,
  IconUserCheck,
} from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const trustItems = [
  { label: "AI Vision", icon: IconBrain, status: "Live" },
  { label: "Dermatology-Inspired", icon: IconMicroscope, status: null },
  { label: "Ingredient Intelligence", icon: IconFlask, status: "Coming soon" },
  { label: "Climate-Aware", icon: IconCloud, status: "Roadmap" },
  { label: "Ayurvedic Wellness", icon: IconLeaf, status: "Roadmap" },
] as const

const steps = [
  {
    title: "Capture",
    text: "Take a selfie or upload a clear image.",
    icon: IconCamera,
  },
  {
    title: "Analyze",
    text: "AI reviews visible cosmetic skin indicators.",
    icon: IconBrain,
  },
  {
    title: "Personalize",
    text: "Guidance adapts to the visible skin profile and user preferences.",
    icon: IconSparkles,
  },
  {
    title: "Report",
    text: "Download a clear cosmetic skin wellness report.",
    icon: IconDownload,
  },
] as const

const features = [
  {
    title: "AI Skin Analysis",
    text: "Reviews visible texture, pores, redness, tone unevenness, and fine-line indicators.",
    icon: IconFileAnalytics,
    status: "Live",
  },
  {
    title: "Guided Cosmetic Insights",
    text: "Turns visible skin indicators into simple, cosmetic-only next steps.",
    icon: IconSparkles,
    status: "Live",
  },
  {
    title: "Ingredient Intelligence",
    text: "Roadmap support for explaining INCI ingredient roles in simple language.",
    icon: IconFlask,
    status: "Roadmap",
  },
  {
    title: "Climate Intelligence",
    text: "Future platform capability for adapting routines using humidity, UV, and weather context.",
    icon: IconCloud,
    status: "Coming soon",
  },
  {
    title: "PDF Reports",
    text: "Generates clean downloadable cosmetic wellness reports for reference.",
    icon: IconReportAnalytics,
    status: "Live",
  },
  {
    title: "Admin Dashboard",
    text: "A live admin workspace for reviewing reports, user activity, and platform operations.",
    icon: IconChartAreaLine,
    status: "Live",
  },
  {
    title: "Skin History",
    text: "Roadmap capability for helping users track cosmetic skin changes over time.",
    icon: IconClipboardText,
    status: "Roadmap",
  },
] as const

const privacyItems = [
  ["Consent before scan", IconUserCheck],
  ["Minimal photo retention", IconCamera],
  ["Secure report access", IconLock],
  ["Encrypted transport", IconShieldCheck],
  ["Delete path", IconRosetteDiscountCheck],
  ["Admin audit trail", IconClipboardText],
] as const

function SectionIntro({
  eyebrow,
  title,
  text,
}: {
  eyebrow?: string
  title: string
  text?: string
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      {eyebrow ? (
        <p className="mb-3 text-xs font-semibold tracking-widest text-primary uppercase">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-3xl font-semibold tracking-normal text-foreground md:text-4xl">
        {title}
      </h2>
      {text ? (
        <p className="mt-4 text-base leading-7 text-muted-foreground md:text-lg">{text}</p>
      ) : null}
    </div>
  )
}

function StatusBadge({ label }: { label: "Live" | "Coming soon" | "Roadmap" }) {
  return <Badge variant={label === "Live" ? "default" : "secondary"}>{label}</Badge>
}

function HeroSection() {
  const bullets = [
    "AI-powered cosmetic analysis",
    "Privacy-first scan flow",
    "Downloadable cosmetic report",
  ]

  return (
    <section className="overflow-hidden border-b border-border bg-muted/30">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-12 sm:px-6 md:py-16 lg:grid-cols-[0.92fr_1.08fr] lg:px-8">
        <div className="relative z-10 max-w-2xl">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-background px-4 py-2 text-xs font-semibold tracking-widest text-primary uppercase shadow-sm">
            <IconSparkles className="size-4 text-primary" />
            AI-POWERED SKIN INTELLIGENCE
          </p>
          <h1 className="font-display text-5xl leading-none font-semibold tracking-normal text-foreground md:text-7xl">
            <span className="block">AI Skin Intelligence</span>
            <span className="block">That Understands</span>
            <span className="block italic text-primary">Your Skin</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            Scan your skin in seconds using your phone or laptop camera and receive
            personalized cosmetic insights and a downloadable cosmetic wellness report.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-14 px-8 text-sm">
              <Link href="/scan">
                <IconCamera className="size-5" />
                Start Free Skin Scan
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-14 px-8 text-sm">
              <Link href="#how-it-works">See How It Works</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {bullets.map((bullet) => (
              <div key={bullet} className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <IconCheck className="size-4" />
                </span>
                {bullet}
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-col gap-4 rounded-lg border border-border bg-background p-5 shadow-sm sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <span className="flex size-12 items-center justify-center rounded-lg border border-border text-foreground">
                <IconShieldCheck className="size-7" />
              </span>
              <div>
                <p className="text-sm font-medium">Privacy-first cosmetic guidance</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Consent-led scans with cosmetic-only wording.
                </p>
              </div>
            </div>
            <div className="hidden h-12 w-px bg-border sm:block" />
            <div className="grid gap-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <IconCheck className="size-4 text-primary" />
                Camera or upload input
              </span>
              <span className="flex items-center gap-2">
                <IconCheck className="size-4 text-primary" />
                Report stored without keeping the photo by default
              </span>
            </div>
          </div>
          <p className="mt-5 max-w-2xl rounded-lg border border-border bg-background/80 p-4 text-sm leading-6 text-muted-foreground">
            <IconShieldCheck className="mr-2 inline size-5 text-primary" />
            Aurora SkinSense provides cosmetic skin wellness insights. It is not a medical
            diagnosis tool.
          </p>
        </div>
        <div className="relative min-h-[42rem]">
          <IconLeaf className="absolute bottom-8 right-2 size-32 text-primary/10" />
          <HeroMockup />
          <HeroResults />
        </div>
      </div>
    </section>
  )
}

function HeroMockup() {
  const progress = ["Lighting", "Face", "Analysis", "Report"]

  return (
    <div className="absolute left-1/2 top-6 z-20 w-full max-w-sm -translate-x-1/2 lg:left-[43%]">
      <div className="absolute inset-y-20 -left-20 right-0 rounded-full border border-dashed border-primary/30" />
      <div className="relative rounded-4xl border border-border bg-background p-3 shadow-xl">
        <div className="relative min-h-[34rem] overflow-hidden rounded-3xl border border-border bg-muted">
          <Image
            src="/Pasted image (3).png"
            alt="AI skin scan preview"
            width={1024}
            height={1536}
            priority
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between p-5 text-primary-foreground">
            <IconChevronLeft className="size-5" />
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className="size-2 rounded-full bg-primary" />
              Scanning...
            </div>
            <IconSparkles className="size-5" />
          </div>
          <div className="absolute inset-0 bg-primary/10" />
          <div className="absolute left-1/2 top-28 z-20 h-80 w-56 -translate-x-1/2 rounded-[45%] border border-primary/30" />
          <div className="absolute left-[24%] right-[24%] top-44 z-30 grid grid-cols-4 gap-4">
            {Array.from({ length: 28 }).map((_, index) => (
              <span key={index} className="size-1 rounded-full bg-primary/60" />
            ))}
          </div>
          <div className="absolute inset-x-8 bottom-6 z-30">
            <div className="mb-4 flex items-center">
              {progress.map((step, index) => (
                <div key={step} className="flex flex-1 items-center">
                  <span className="flex size-5 items-center justify-center rounded-full bg-background text-primary">
                    {index < 3 ? <IconCheck className="size-3" /> : null}
                  </span>
                  {index < progress.length - 1 ? (
                    <span className="h-1 flex-1 bg-background/70" />
                  ) : null}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-2 text-center text-xs font-semibold text-primary-foreground">
              {progress.map((step) => (
                <span key={step}>{step}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function HeroResults() {
  const overview = [
    ["Texture", "Balanced"],
    ["Pigmentation", "Mild"],
    ["Hydration Signs", "Moderate"],
    ["Redness Appearance", "Low"],
  ] as const

  return (
    <div className="absolute inset-y-0 right-0 z-30 hidden w-80 content-center gap-4 lg:grid">
      <div className="rounded-xl border border-border bg-background p-6 shadow-lg">
        <div className="mb-5 flex items-center gap-3">
          <IconSparkles className="size-5 text-primary" />
          <h2 className="font-heading text-base font-semibold">Your Skin Overview</h2>
        </div>
        <div className="grid gap-4">
          {overview.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-4 text-sm">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-semibold text-primary">{value}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-border bg-background p-6 shadow-lg">
        <div className="mb-5 flex items-center gap-3">
          <IconReportAnalytics className="size-5 text-primary" />
          <h2 className="font-heading text-base font-semibold">Cosmetic Report</h2>
        </div>
        <div className="grid gap-3 text-sm text-muted-foreground">
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted p-3">
            <span>Skin profile</span>
            <span className="font-medium text-foreground">Balanced</span>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted p-3">
            <span>Guidance type</span>
            <span className="font-medium text-foreground">Cosmetic</span>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted p-3">
            <span>Photo retention</span>
            <span className="font-medium text-foreground">Minimal</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-[1fr_auto] items-center gap-5 rounded-xl border border-border bg-background p-6 shadow-lg">
        <div>
          <div className="mb-3 flex items-center gap-3">
            <IconCheck className="size-5 text-primary" />
            <h2 className="font-heading text-base font-semibold">Report Ready</h2>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            Your personalized cosmetic wellness report is ready to download.
          </p>
        </div>
        <span className="flex size-16 items-center justify-center rounded-lg border border-border bg-muted text-primary">
          <IconFileTypePdf className="size-10" />
        </span>
      </div>
      <div className="absolute -bottom-16 right-0 hidden items-end gap-4 lg:flex">
        <div className="flex h-24 w-32 items-center justify-center rounded-xl border border-border bg-background shadow-sm">
          <div className="h-14 w-20 rounded-t-full border border-primary/40 bg-muted" />
        </div>
        <div className="h-28 w-12 rounded-full border border-border bg-background shadow-sm" />
      </div>
    </div>
  )
}

function TrustStrip() {
  return (
    <section id="technology" className="border-b border-border bg-background">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-5 sm:grid-cols-2 sm:px-6 lg:grid-cols-5 lg:px-8">
        {trustItems.map(({ label, icon: Icon, status }) => (
          <div key={label} className="flex items-center gap-4">
            <Icon className="size-8 shrink-0 text-primary" />
            <div className="grid gap-1">
              <span className="font-heading text-base font-semibold text-foreground">{label}</span>
              {status ? (
                <span className="text-sm text-muted-foreground">{status}</span>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionIntro
          eyebrow="How it works"
          title="From selfie to cosmetic skin insight in a guided flow"
        />
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ title, text, icon: Icon }, index) => (
            <Card key={title}>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                    {index + 1}
                  </span>
                  <Icon className="size-6 text-primary" />
                </div>
                <h3 className="mt-6 text-xl font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

function ScanPreview() {
  const checks = ["Lighting check", "Face detected", "Skin zones reviewed", "Report ready"]

  return (
    <section className="border-y border-border bg-muted/30 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2">
        <div>
          <p className="mb-3 text-xs font-semibold tracking-widest text-primary uppercase">
            Live AI scan preview
          </p>
          <h2 className="text-3xl font-semibold md:text-4xl">See the scan journey in action</h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
            Aurora SkinSense guides users from image capture to cosmetic insight with a
            simple, privacy-first flow.
          </p>
          <div className="mt-8 grid gap-3">
            {[
              "Camera and upload support",
              "Image quality guidance",
              "Coarse confidence bands",
              "Report generated after consent",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm text-muted-foreground">
                <IconCheck className="size-4 text-primary" />
                {item}
              </div>
            ))}
          </div>
        </div>
        <Card className="rounded-2xl">
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                  Scan progress
                </p>
                <p className="mt-1 font-heading text-xl font-semibold">Quality review</p>
              </div>
              <IconDeviceMobile className="size-7 text-primary" />
            </div>
            <div className="mt-6 h-3 rounded-full bg-muted">
              <div className="h-3 w-4/5 rounded-full bg-primary" />
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-[0.8fr_1fr]">
              <div className="relative min-h-64 rounded-xl border border-border bg-muted">
                <div className="absolute inset-x-8 top-8 h-44 rounded-full border border-primary/60" />
                <div className="absolute inset-x-14 top-20 h-20 rounded-full border border-border" />
                <div className="absolute inset-x-10 bottom-6 rounded-lg bg-background p-3 text-center text-xs text-muted-foreground">
                  User consent confirmed
                </div>
              </div>
              <div className="grid content-center gap-3">
                {checks.map((check) => (
                  <div key={check} className="flex items-center gap-3 rounded-lg border border-border bg-background p-3">
                    <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <IconCheck className="size-4" />
                    </span>
                    <span className="text-sm font-medium">{check}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

function FeatureGrid() {
  const liveFeatures = features.filter((feature) => feature.status === "Live")
  const upcomingFeatures = features.filter((feature) => feature.status !== "Live")

  return (
    <section id="features" className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionIntro
          eyebrow="Core features"
          title="A practical skin intelligence layer for modern beauty journeys"
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {liveFeatures.map(({ title, text, icon: Icon }) => (
            <Card key={title}>
              <CardContent>
                <Icon className="size-7 text-primary" />
                <h3 className="mt-5 text-xl font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{text}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-dashed border-border p-6 sm:p-8">
          <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            On the roadmap
          </p>
          <div className="mt-5 grid gap-6 sm:grid-cols-3">
            {upcomingFeatures.map(({ title, text, icon: Icon, status }) => (
              <div key={title} className="flex gap-3">
                <Icon className="size-5 shrink-0 text-muted-foreground" />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold">{title}</h3>
                    <StatusBadge label={status} />
                  </div>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function SecurityPrivacy() {
  return (
    <section id="privacy" className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="mb-3 text-xs font-semibold tracking-widest text-primary uppercase">
              Security & privacy
            </p>
            <h2 className="text-3xl font-semibold md:text-4xl">Built with privacy at the center</h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
              The scan experience is designed around consent, minimal retention, and clear user
              control.
            </p>
          </div>
          <div>
            <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
              {privacyItems.map(([item, Icon]) => (
                <div key={item} className="flex items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="size-4" />
                  </span>
                  <h3 className="font-heading text-sm font-semibold">{item}</h3>
                </div>
              ))}
            </div>
            <p className="mt-8 rounded-lg border border-border bg-muted p-4 text-sm leading-6 text-muted-foreground">
              By default, Aurora SkinSense should store the report, not the original photo, unless
              the user explicitly consents.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

function FinalCTA() {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl rounded-2xl border border-border bg-primary p-8 text-center text-primary-foreground shadow-sm md:p-12">
        <h2 className="text-3xl font-semibold md:text-5xl">
          Discover what your skin has been trying to tell you.
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-primary-foreground/80">
          Start with a simple scan and receive cosmetic skin insights and a downloadable
          report.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild variant="secondary" size="lg">
            <Link href="/scan">Start Free Skin Scan</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10"
          >
            <Link href="#privacy">Review Privacy</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

function LandingFooter() {
  const columns = [
    ["Product", "AI Skin Analysis", "PDF Reports", "Privacy-first Scan Flow"],
    ["Platform", "For Consumers", "Admin Dashboard", "Settings"],
    ["Company", "About Aurora", "Contact", "Privacy", "Terms"],
  ] as const

  return (
    <footer className="border-t border-border px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1fr_1.4fr]">
        <div>
          <Link href="/" className="font-heading text-lg font-semibold">
            Aurora SkinSense
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">
            Aurora SkinSense provides cosmetic wellness guidance only and is not a medical
            diagnostic tool.
          </p>
        </div>
        <div className="grid gap-8 sm:grid-cols-3">
          {columns.map(([title, ...links]) => (
            <div key={title}>
              <h3 className="font-heading text-sm font-semibold">{title}</h3>
              <div className="mt-4 grid gap-3">
                {links.map((link) => (
                  <Link
                    key={link}
                    href="/"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </footer>
  )
}

export function LandingPageContent() {
  return (
    <div className="flex flex-col bg-background text-foreground">
      <HeroSection />
      <TrustStrip />
      <HowItWorks />
      <ScanPreview />
      <FeatureGrid />
      <SecurityPrivacy />
      <FinalCTA />
      <LandingFooter />
    </div>
  )
}
