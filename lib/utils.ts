// Shared class-name helper used across the app (per AGENTS.md, the one
// truly generic utility that isn't scoped to a single feature).
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// Combines conditional class names (clsx) and then resolves conflicting
// Tailwind utility classes so the last one wins (twMerge), e.g. letting a
// caller override a component's default `p-4` with its own `p-2`.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Guards against an open redirect: a `callbackURL`/`redirect` query param is
// attacker-controllable (anyone can type `/login?callbackURL=https://evil.com`
// into a browser), so it must never be followed as-is. Only accepts an
// internal, relative, single-leading-slash path.
export function getSafeRedirectPath(value: string | null | undefined): string | null {
  if (!value) return null
  // Rejects a protocol-relative `//host/...` (a browser resolves that to an
  // external origin the same as a full URL) and anything with a scheme
  // (`http:`, `javascript:`, etc., which don't start with `/` at all).
  if (!value.startsWith("/") || value.startsWith("//")) return null

  const base = "http://localhost"
  let resolved: URL

  try {
    resolved = new URL(value, base)
  } catch {
    return null
  }

  // Catches the backslash bypass: `/\evil.com` starts with a single `/` but
  // browsers (and URL()) treat `\` as `/`, so it still resolves to an
  // external origin — reject anything that doesn't resolve back to the same
  // (arbitrary, fixed) base origin used above.
  if (resolved.origin !== base) return null

  return value
}
