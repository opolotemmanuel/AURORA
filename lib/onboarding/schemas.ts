import { z } from "zod"

export const consentSchema = z.object({
  photoProcessingConsent: z.boolean().refine((v) => v === true, {
    message: "You must consent to photo processing to continue.",
  }),
  marketingConsent: z.boolean().optional(),
})

export const basicsSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  biologicalSex: z
    .enum(["female", "male", "intersex", "prefer_not_to_say"])
    .optional(),
})

export const skinSchema = z.object({
  skinType: z.enum(["oily", "dry", "combination", "sensitive", "normal"]),
  fitzpatrickBand: z.enum(["I", "II", "III", "IV", "V", "VI"]),
  primaryConcerns: z.array(z.string()).min(1, "Select at least one concern"),
  skinGoals: z.array(z.string()).min(1, "Select at least one goal"),
  allergies: z.string().max(2000).optional(),
  expertReviewRequested: z.boolean().optional(),
})

export const routineSchema = z.object({
  currentRoutine: z.object({
    am: z.string().max(2000).optional(),
    pm: z.string().max(2000).optional(),
  }),
  previousPrescriptions: z
    .array(
      z.object({
        name: z.string().min(1),
        active: z.boolean(),
        notes: z.string().max(1000).optional(),
        startedAt: z.string().optional(),
      })
    )
    .optional(),
  medications: z
    .array(
      z.object({
        name: z.string().min(1),
        notes: z.string().max(1000).optional(),
      })
    )
    .optional(),
})

export const lifestyleSchema = z.object({
  lifestyleFactors: z.object({
    sunExposure: z.enum(["low", "moderate", "high"]),
    smoking: z.enum(["never", "former", "current"]),
    sleepHours: z.enum(["under_6", "6_to_7", "7_to_8", "over_8"]),
    waterIntake: z.enum(["low", "moderate", "high"]),
  }),
})

export const locationSchema = z.object({
  city: z.string().min(1, "City is required"),
  region: z.string().min(1, "Region is required"),
  country: z.string().min(1, "Country is required"),
  postalCode: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  locationSource: z.enum(["manual", "geocode", "browser"]).default("manual"),
})

export const passwordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export const productSchema = z.object({
  sku: z.string().min(1).max(64),
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  category: z.string().min(1).max(120),
  ingredients: z.string().max(5000).optional(),
  targetConcerns: z.array(z.string()).default([]),
  suitableSkinTypes: z.array(z.string()).default([]),
  climateTags: z.array(z.string()).default([]),
  imageUrl: z.string().url().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
})

export const tokenGrantSchema = z.object({
  userId: z.string().min(1),
  amount: z.number().int().positive(),
  reason: z.string().max(500).optional(),
})
