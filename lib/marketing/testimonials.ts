// Adapted from wyasyn/aura's review branch: dropped the `avatar` field
// entirely rather than porting it — review hotlinks avatars.githubusercontent.com
// URLs, which AGENTS.md's Image Rule forbids ("do not hotlink external
// images in production UI"). Avatar/AvatarFallback renders initials only.
export interface Testimonial {
  name: string
  role: string
  content: string
}

export const TESTIMONIALS: Testimonial[] = [
  {
    name: "Maya Chen",
    role: "Skincare enthusiast",
    content:
      "The band-based results felt honest, with no fake precision scores. I finally understood what my routine was missing.",
  },
  {
    name: "Jordan Ellis",
    role: "Combination skin",
    content:
      "The scan was quick and the guidance actually fit my climate and skin goals, not a generic list.",
  },
  {
    name: "Priya Sharma",
    role: "Wellness blogger",
    content:
      "I appreciate the cosmetic framing throughout. Clear guidance without pretending to be a medical diagnosis.",
  },
  {
    name: "Alex Rivera",
    role: "First-time scanner",
    content:
      "The onboarding was simple and the report is something I keep coming back to when refining my routine.",
  },
  {
    name: "Sam Okonkwo",
    role: "Routine minimalist",
    content:
      "Short, actionable bands instead of overwhelming charts. It helped me simplify without guessing.",
  },
  {
    name: "Elena Vasquez",
    role: "Sensitive skin",
    content:
      "Privacy-first by default sold me. I get the report value without feeling like my photo lives on a server forever.",
  },
]

export const HERO_TRUST_AVATAR_COUNT = 5

export const HERO_TRUST_LABEL = "Trusted by thousands exploring their skin"
