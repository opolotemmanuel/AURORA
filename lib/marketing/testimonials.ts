export interface Testimonial {
  name: string
  role: string
  avatar: string
  content: string
}

export const TESTIMONIALS: Testimonial[] = [
  {
    name: "Maya Chen",
    role: "Skincare enthusiast",
    avatar: "https://avatars.githubusercontent.com/u/9919?v=4",
    content:
      "The band-based results felt honest — no fake precision scores. I finally understood what my routine was missing.",
  },
  {
    name: "Jordan Ellis",
    role: "Aurora customer",
    avatar: "https://avatars.githubusercontent.com/u/583231?v=4",
    content:
      "Scan to report took minutes. The product matches were relevant to my climate and skin goals, not generic lists.",
  },
  {
    name: "Priya Sharma",
    role: "Wellness blogger",
    avatar: "https://avatars.githubusercontent.com/u/13041?v=4",
    content:
      "I appreciate the cosmetic framing throughout. Clear guidance without pretending to be a medical diagnosis.",
  },
  {
    name: "Alex Rivera",
    role: "First-time scanner",
    avatar: "https://avatars.githubusercontent.com/u/499550?v=4",
    content:
      "The onboarding was simple and the PDF report is something I actually reference when shopping for serums.",
  },
  {
    name: "Sam Okonkwo",
    role: "Routine minimalist",
    avatar: "https://avatars.githubusercontent.com/u/810438?v=4",
    content:
      "Short, actionable bands instead of overwhelming charts. It helped me simplify without guessing.",
  },
  {
    name: "Elena Vasquez",
    role: "Aurora member",
    avatar: "https://avatars.githubusercontent.com/u/1500684?v=4",
    content:
      "Privacy-first by default sold me. I get the report value without feeling like my photo lives on a server forever.",
  },
]

export const HERO_TRUST_AVATAR_COUNT = 5

export const HERO_TRUST_LABEL = "Trusted by thousands exploring their skin"
