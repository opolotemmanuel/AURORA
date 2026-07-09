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
