import { Footer20 } from "@/components/ui/footer-20"
import { AURORA_STORE_ORIGIN } from "@/lib/products/constants"

export function LandingFooter() {
  return (
    <Footer20
      description="Clear skin insights, routines built for you, and product matches you can act on. Thoughtful skincare, made personal."
      email="info@auroraorganics.co"
      links={{
        good: [
          { label: "Home", href: "/" },
          { label: "Start your scan", href: "/scan" },
          { label: "Sign in", href: "/login" },
          { label: "Sign up", href: "/register" },
        ],
        // No public (unauthenticated) privacy/terms page exists yet — our
        // /privacy is a signed-in-only data-management dashboard, and there
        // is no /terms route. Rather than link to a login wall or a 404,
        // this column is dropped entirely (see Footer20's `links.boring`).
        boring: [],
        cool: [
          { label: "Aurora Organics", href: AURORA_STORE_ORIGIN },
          { label: "Contact", href: "mailto:info@auroraorganics.co" },
        ],
      }}
    />
  )
}
