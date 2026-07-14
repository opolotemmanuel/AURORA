// Display copy for each dosha — paraphrased traditional Ayurvedic
// associations, framed the same way AGENTS.md requires for the cosmetic AI
// assessment: wellness/traditional guidance, never a fact, diagnosis, or
// treatment claim. Also doubles as the source of truth for matching against
// Product.doshaTags (see lib/dosha/product-tags.ts).
import type { Dosha } from "./questions"

export const DOSHA_LABELS: Record<Dosha, string> = {
  vata: "Vata",
  pitta: "Pitta",
  kapha: "Kapha",
}

export type DoshaContent = {
  label: string
  elements: string
  traits: string[]
  skincareGuidance: string[]
}

export const DOSHA_CONTENT: Record<Dosha, DoshaContent> = {
  vata: {
    label: "Vata",
    elements: "Traditionally associated with air and space.",
    traits: [
      "Quick-thinking and creative, with energy that tends to come in bursts.",
      "Lean, light body frame.",
      "Skin and hair that traditionally lean dry.",
      "More sensitive to cold and to change or irregularity.",
    ],
    skincareGuidance: [
      "Traditional guidance favors rich, warming, grounding oils (like sesame or almond) to counter dryness.",
      "Gentle, consistent routines are traditionally favored over frequent switching.",
      "Warmth-focused practices (warm water, warm oils) are traditionally emphasized over cold or very light textures.",
    ],
  },
  pitta: {
    label: "Pitta",
    elements: "Traditionally associated with fire and water.",
    traits: [
      "Focused, driven, and organized, with strong intensity.",
      "Medium, athletic body frame.",
      "Skin that traditionally leans warm and sensitive, sometimes prone to redness.",
      "Less tolerant of heat than of cold.",
    ],
    skincareGuidance: [
      "Traditional guidance favors cooling, calming ingredients (like aloe, sandalwood, or rose).",
      "Lighter textures are traditionally preferred over heavy, warming ones.",
      "Traditional practice emphasizes limiting excess heat and sun exposure where possible.",
    ],
  },
  kapha: {
    label: "Kapha",
    elements: "Traditionally associated with earth and water.",
    traits: [
      "Steady, calm, and nurturing, with strong stamina once moving.",
      "Solid, sturdy body frame.",
      "Skin and hair that traditionally lean thicker and more oil-rich.",
      "Slower to start, slower to change.",
    ],
    skincareGuidance: [
      "Traditional guidance favors lighter, invigorating ingredients (like citrus or neem) to help balance richness.",
      "Routines that stimulate and refresh are traditionally favored over heavy, rich formulas.",
      "Traditional practice emphasizes regular movement and variety to offset a tendency toward stagnation.",
    ],
  },
}
