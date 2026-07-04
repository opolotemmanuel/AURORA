"use client"

import { useRouter } from "next/navigation"

import { PerformanceOverview } from "@/components/ui/cta-4"

const periods = [
  {
    id: "week",
    label: "This week",
    metrics: [
      {
        id: "scans",
        label: "Scans",
        value: "2.4k",
        changePercent: 12,
        icon: "chart" as const,
      },
      {
        id: "reports",
        label: "Reports",
        value: "1.9k",
        changePercent: 8,
        icon: "users" as const,
      },
      {
        id: "matches",
        label: "Matches",
        value: "94%",
        changePercent: 3,
        icon: "product" as const,
      },
      {
        id: "satisfaction",
        label: "Satisfaction",
        value: "4.8",
        changePercent: 5,
        icon: "finance" as const,
      },
    ],
    activities: [
      {
        id: "1",
        title: "Skin balance report generated",
        timestamp: "2 min ago",
        value: "",
        isPositive: true,
      },
      {
        id: "2",
        title: "Aurora serum recommended",
        timestamp: "18 min ago",
        value: "",
        isPositive: true,
      },
      {
        id: "3",
        title: "Climate profile synced",
        timestamp: "1 hr ago",
        value: "",
        isPositive: true,
      },
    ],
  },
]

export function LandingCta() {
  const router = useRouter()

  return (
    <PerformanceOverview
      title="Ready for your"
      accentWord="first scan?"
      subtitle="Create an account, complete a short onboarding, and receive your personalized cosmetic skin report in minutes."
      ctaLabel="Start your scan"
      onCtaClick={() => router.push("/scan")}
      periods={periods}
      defaultPeriodId="week"
    />
  )
}
