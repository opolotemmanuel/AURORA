import { PerformanceOverview } from "@/components/ui/cta-4"

const periods = [
  {
    id: "latest",
    label: "Your scan",
    metrics: [
      {
        id: "hydration",
        label: "Hydration",
        value: "Balanced",
        changePercent: 12,
        icon: "chart" as const,
      },
      {
        id: "tone",
        label: "Tone",
        value: "Even",
        changePercent: 8,
        icon: "users" as const,
      },
      {
        id: "texture",
        label: "Texture",
        value: "Smooth",
        changePercent: 5,
        icon: "product" as const,
      },
      {
        id: "matches",
        label: "Matches",
        value: "4",
        changePercent: 3,
        icon: "finance" as const,
      },
    ],
    activities: [
      {
        id: "1",
        title: "Skin report generated",
        timestamp: "Just now",
        value: "",
        isPositive: true,
      },
      {
        id: "2",
        title: "Serum matched to your routine",
        timestamp: "Just now",
        value: "",
        isPositive: true,
      },
      {
        id: "3",
        title: "Report saved to dashboard",
        timestamp: "Just now",
        value: "",
        isPositive: true,
      },
    ],
  },
]

export function LandingCta() {
  return (
    <PerformanceOverview
      title="Ready to understand"
      accentWord="your skin?"
      subtitle="Set up your profile and run one scan for a skin snapshot, product matches filtered to your allergies, and a report you keep. Three free scans, no card required."
      ctaLabel="Start your free scan"
      ctaHref="/scan"
      periods={periods}
      defaultPeriodId="latest"
    />
  )
}
