// Adapted from wyasyn/aura's review branch: review imports a static binary
// asset (assets/hero.jpg) we don't have. Reusing this project's own existing
// marketing asset instead — already committed, already Aurora-branded (has
// the scan-overlay graphic) — rather than pulling in a new, unverified
// stock photo.
export const PLACEHOLDER_IMAGES = {
  hero: "/Pasted image (3).png",
} as const
