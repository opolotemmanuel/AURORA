"use client"

// Wraps next-themes with this app's defaults (class-based dark mode,
// system preference) and adds a global "d" keyboard shortcut to toggle
// theme — wired in once here at the root layout rather than per-page.
//
// KNOWN DEV-ONLY WARNING: "Encountered a script tag while rendering React
// component." React 19 warns on any <script> element it must construct
// client-side without a recognized `type` (data-block) attribute.
// next-themes injects its pre-hydration flash-prevention script this way
// (no `type` set) — a known React 19 incompatibility, unfixed upstream
// (next-themes unmaintained since March 2025; see
// https://github.com/pacocoursey/next-themes/issues/387 and
// https://github.com/shadcn-ui/ui/issues/10104). No functional impact: the
// script still runs correctly from the server-rendered HTML before
// hydration — theme flash prevention and switching both work normally in
// dev and production. Safe to ignore; do not "fix" by removing
// suppressHydrationWarning (app/layout.tsx) or altering the provider setup.
import * as React from "react"
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes"

function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      <ThemeHotkey />
      {children}
    </NextThemesProvider>
  )
}

// Guards the "d" hotkey below from firing while the user is actually typing
// "d" into a form field.
function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  )
}

function ThemeHotkey() {
  const { resolvedTheme, setTheme } = useTheme()

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.repeat) {
        return
      }

      if (event.metaKey || event.ctrlKey || event.altKey) {
        return
      }

      if (event.key.toLowerCase() !== "d") {
        return
      }

      if (isTypingTarget(event.target)) {
        return
      }

      setTheme(resolvedTheme === "dark" ? "light" : "dark")
    }

    window.addEventListener("keydown", onKeyDown)

    return () => {
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [resolvedTheme, setTheme])

  return null
}

export { ThemeProvider }
