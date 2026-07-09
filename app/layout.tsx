// Root layout: fonts, global CSS, and the theme provider only — all actual
// page chrome (nav/sidebar/etc.) lives in each route group's own layout
// (see AGENTS.md's route-group table).
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    // suppressHydrationWarning: next-themes sets the `dark` class on <html>
    // before React hydrates (to avoid a flash of the wrong theme), which
    // would otherwise trigger a hydration mismatch warning here.
    <html lang="en" suppressHydrationWarning className="font-sans antialiased">
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
