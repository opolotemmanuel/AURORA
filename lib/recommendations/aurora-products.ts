// NOTE: this static catalog is not imported anywhere in the app, any prisma
// seed script, or elsewhere — the live recommendation path
// (lib/backend/product-service.ts's listActiveRecommendationProducts) reads
// products from Postgres instead. This looks like placeholder/seed data
// from before the DB-backed catalog existed; worth confirming whether it's
// still needed before removing it.
import type { AuroraProduct } from "./types"

export const auroraProducts: AuroraProduct[] = [
  {
    id: "aurora-glow-serum",
    name: "Aurora Glow Serum",
    category: "Serum",
    routineStep: "treat",
    shortDescription: "A lightweight radiance serum for brighter-looking, comfortably hydrated skin.",
    cosmeticBenefits: ["Radiance support", "Hydration appearance", "Smoother-looking texture"],
    bestFor: ["hydration", "radiance", "texture"],
    priority: 92,
  },
  {
    id: "barrier-calm-cream",
    name: "Barrier Calm Cream",
    category: "Moisturizer",
    routineStep: "moisturize",
    shortDescription: "A comforting moisturizer for skin that looks or feels stressed, dry, or delicate.",
    cosmeticBenefits: ["Barrier comfort", "Redness appearance support", "Softness"],
    bestFor: ["barrierComfort", "rednessAppearance", "hydration"],
    priority: 88,
  },
  {
    id: "radiance-daily-cleanser",
    name: "Radiance Daily Cleanser",
    category: "Cleanser",
    routineStep: "cleanse",
    shortDescription: "A gentle daily cleanser to refresh the skin without a tight-feeling finish.",
    cosmeticBenefits: ["Gentle cleansing", "Oil balance", "Fresh skin feel"],
    bestFor: ["oilBalance", "texture", "radiance"],
    priority: 76,
  },
  {
    id: "mineral-day-shield",
    name: "Mineral Day Shield",
    category: "Day cream",
    routineStep: "protect",
    shortDescription: "A daytime finishing step for cosmetic environmental protection and an even-looking glow.",
    cosmeticBenefits: ["Daytime protection step", "Even-looking tone", "Daily routine support"],
    bestFor: ["daytimeProtection", "pigmentationAppearance", "radiance"],
    priority: 84,
  },
  {
    id: "ayurvedic-night-renewal-oil",
    name: "Ayurvedic Night Renewal Oil",
    category: "Facial oil",
    routineStep: "treat",
    shortDescription: "A nourishing night oil for a smoother, more supple-looking morning glow.",
    cosmeticBenefits: ["Supple feel", "Dryness appearance support", "Night routine care"],
    bestFor: ["hydration", "barrierComfort", "texture"],
    avoidIf: ["oilBalance"],
    priority: 70,
  },
]
