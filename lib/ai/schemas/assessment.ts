import { Type } from "@google/genai"

export const skinAssessmentJsonSchema = {
  type: Type.OBJECT,
  required: [
    "overallBand",
    "dimensions",
    "summary",
    "naturalRecommendations",
    "recommendations",
  ],
  properties: {
    overallBand: {
      type: Type.STRING,
      enum: ["minimal", "mild", "moderate", "elevated", "not_assessed"],
      description:
        "Coarse overall cosmetic assessment band. Never use percentages or medical diagnoses.",
    },
    dimensions: {
      type: Type.ARRAY,
      description: "Per-dimension cosmetic band assessments.",
      items: {
        type: Type.OBJECT,
        required: ["id", "label", "band", "note"],
        properties: {
          id: {
            type: Type.STRING,
            description: "Stable snake_case id, e.g. hydration, texture.",
          },
          label: { type: Type.STRING },
          band: {
            type: Type.STRING,
            enum: ["minimal", "mild", "moderate", "elevated", "not_assessed"],
          },
          note: {
            type: Type.STRING,
            description: "Short personalized note referencing user context.",
          },
        },
      },
    },
    summary: {
      type: Type.STRING,
      description:
        "2-4 sentence personalized cosmetic summary. Not a medical diagnosis.",
    },
    naturalRecommendations: {
      type: Type.ARRAY,
      description:
        "3-4 personalized natural-care steps before products: lifestyle habits, climate-aware routines, and gentle at-home natural-ingredient ideas. Cosmetic guidance only.",
      items: {
        type: Type.OBJECT,
        required: [
          "id",
          "title",
          "description",
          "applicationTime",
          "applicationFrequency",
        ],
        properties: {
          id: {
            type: Type.STRING,
            description: "Stable snake_case id, e.g. daily_hydration.",
          },
          title: {
            type: Type.STRING,
            description: "Short action label.",
          },
          description: {
            type: Type.STRING,
            description:
              "1-2 sentences explaining the step and why it fits this user. Do not repeat applicationTime or applicationFrequency here.",
          },
          applicationTime: {
            type: Type.STRING,
            enum: ["morning", "evening", "anytime", "morning_and_evening"],
            description:
              "When during the day to do this step or apply this product.",
          },
          applicationFrequency: {
            type: Type.STRING,
            enum: [
              "once_daily",
              "twice_daily",
              "as_needed",
              "few_times_weekly",
              "weekly",
            ],
            description:
              "How often per day or week (e.g. once daily, twice daily, as needed).",
          },
        },
      },
    },
    recommendations: {
      type: Type.ARRAY,
      description:
        "2-4 Aurora product recommendations. id must be an exact catalog slug.",
      items: {
        type: Type.OBJECT,
        required: [
          "id",
          "name",
          "reason",
          "applicationTime",
          "applicationFrequency",
        ],
        properties: {
          id: {
            type: Type.STRING,
            description: "Exact product slug from the provided catalog.",
          },
          name: { type: Type.STRING },
          reason: {
            type: Type.STRING,
            description:
              "Why this product fits the scan and user context, including how to use it. Do not repeat applicationTime or applicationFrequency here.",
          },
          applicationTime: {
            type: Type.STRING,
            enum: ["morning", "evening", "anytime", "morning_and_evening"],
            description:
              "When during the day to apply this product.",
          },
          applicationFrequency: {
            type: Type.STRING,
            enum: [
              "once_daily",
              "twice_daily",
              "as_needed",
              "few_times_weekly",
              "weekly",
            ],
            description:
              "How often per day or week to apply this product.",
          },
        },
      },
    },
  },
} as const
