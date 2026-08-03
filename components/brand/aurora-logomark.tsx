// The Aurora Organics logo mark — the same asset used for app/icon.png and
// app/apple-icon.png (pulled from wyasyn/review's app/apple-icon.png, git
// fetched and inspected in full: a 180x180 "A" monogram on an orange
// circle, confirmed to actually be a small logo mark rather than hero
// photography before using it here). One shared component so every brand
// mark across the app (sidebar, login/register hero panel, report cover,
// scan flow header, marketing footer) renders the exact same image instead
// of five separate <Image> call sites that could drift out of sync.
import Image from "next/image"

import { cn } from "@/lib/utils"

export function AuroraLogomark({ className }: { className?: string }) {
  return (
    <Image
      src="/brand/aurora-organics-logo.png"
      alt="Aurora Organics"
      width={180}
      height={180}
      className={cn("size-5 shrink-0", className)}
    />
  )
}
