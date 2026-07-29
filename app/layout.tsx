import type { Metadata } from "next"
import { Cormorant_Garamond, Geist_Mono, Inter } from "next/font/google"

import { Suspense } from "react"

import "./globals.css"
import { AnalyticsConsentLoader } from "@/components/privacy/analytics-consent-loader"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"

// Inter carries both body and headings. Cormorant stays reserved for display
// type on marketing surfaces, where it has the size to read as editorial.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

const interHeading = Inter({ subsets: ["latin"], variable: "--font-heading" })

const cormorantDisplay = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-display",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

// Falls back to the deployment URL on Vercel, then to localhost in development,
// so OG and canonical URLs resolve correctly in every environment.
const siteUrl =
  process.env.BETTER_AUTH_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000")

const SITE_NAME = "Aurora Organics"
const SITE_DESCRIPTION =
  "Scan your skin and get a cosmetic assessment in plain-language bands, an Ayurvedic skin lean, and Aurora Organics product matches filtered to your allergies and local climate. Three free scans, and your photo is never stored."

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${SITE_NAME} | Skin intelligence`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "skin scan",
    "skincare analysis",
    "personalized skincare",
    "cosmetic skin assessment",
    "Aurora Organics",
  ],
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} | Skin intelligence`,
    description: SITE_DESCRIPTION,
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | Skin intelligence`,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased font-sans",
        inter.variable,
        interHeading.variable,
        cormorantDisplay.variable,
        fontMono.variable
      )}
    >
      <body>
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
        {/* Behind Suspense: reading the consent cookie must not make every
            route dynamic. */}
        <Suspense fallback={null}>
          <AnalyticsConsentLoader />
        </Suspense>
      </body>
    </html>
  )
}
