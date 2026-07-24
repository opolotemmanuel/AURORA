// Root layout: fonts, global CSS, and the theme provider only — all actual
// page chrome (nav/sidebar/etc.) lives in each route group's own layout
// (see AGENTS.md's route-group table).
import "./globals.css"
import { Cormorant_Garamond, Geist_Mono, Inter, Roboto } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"

// Self-hosted via next/font/google (build-time download, no runtime request
// to Google) — each `variable` name is deliberately matched up with the
// --font-sans/--font-heading/--font-display/--font-mono custom properties
// app/globals.css's `@theme inline` block already declares, so this is the
// only place those tokens' actual font files are wired in; every existing
// font-sans/font-heading/font-display/font-mono usage elsewhere keeps
// working unchanged. All four are variable fonts, so no `weight` is set.
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

const roboto = Roboto({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto",
})

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-cormorant-garamond",
})

// Geist Mono isn't in AGENTS.md's font-sans/heading/display trio, but it's
// the fourth font that same stack list names for --font-mono (chart.tsx,
// FacePositionOverlay.tsx, chat-markdown.tsx all already reference
// font-mono) — it had the exact same "declared but never loaded" gap as
// the other three, so it's fixed here too rather than left half-done.
const geistMono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    // suppressHydrationWarning: next-themes sets the `dark` class on <html>
    // before React hydrates (to avoid a flash of the wrong theme), which
    // would otherwise trigger a hydration mismatch warning here.
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${roboto.variable} ${cormorantGaramond.variable} ${geistMono.variable} font-sans antialiased`}
    >
      <body>
        <ThemeProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
