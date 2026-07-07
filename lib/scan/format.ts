import type { AssessmentBand, ApplicationFrequency, ApplicationTime } from "@/lib/scan/types"

const BAND_LABEL: Record<AssessmentBand, string> = {
  minimal: "Balanced",
  mild: "Mostly balanced",
  moderate: "Moderate",
  elevated: "Elevated",
  not_assessed: "Not assessed",
}

const SKIN_HEADLINE: Record<AssessmentBand, string> = {
  minimal: "Generally balanced with negligible visible concerns",
  mild: "Mostly balanced with minor areas that could use gentle support",
  moderate: "Some visible cosmetic patterns worth addressing in your routine",
  elevated: "More noticeable cosmetic patterns worth prioritizing in your routine",
  not_assessed: "Not fully assessed in this scan",
}

export function formatBand(band: AssessmentBand) {
  return BAND_LABEL[band]
}

export function formatSkinHeadline(band: AssessmentBand) {
  return SKIN_HEADLINE[band]
}

const CLIMATE_BAND_LABEL: Record<string, string> = {
  low: "Low",
  moderate: "Moderate",
  high: "High",
  extreme: "Extreme",
}

const CLIMATE_ZONE_LABEL: Record<string, string> = {
  humid_subtropical: "Humid subtropical",
  arid: "Arid",
  cold: "Cold",
  temperate_humid: "Temperate humid",
  temperate: "Temperate",
}

const SEASON_LABEL: Record<string, string> = {
  spring: "Spring",
  summer: "Summer",
  autumn: "Autumn",
  winter: "Winter",
}

export function formatClimateBand(band: string | null | undefined) {
  if (!band) return "—"
  return CLIMATE_BAND_LABEL[band] ?? band
}

export function formatClimateZone(zone: string | null | undefined) {
  if (!zone) return "—"
  return CLIMATE_ZONE_LABEL[zone] ?? zone.replaceAll("_", " ")
}

export function formatSeasonBand(season: string | null | undefined) {
  if (!season) return "—"
  return SEASON_LABEL[season] ?? season
}

export function formatLocationLabel(input: {
  city?: string | null
  region?: string | null
  country?: string | null
}) {
  return [input.city, input.region, input.country].filter(Boolean).join(", ")
}

const APPLICATION_TIME_LABEL: Record<ApplicationTime, string> = {
  morning: "Morning",
  evening: "Evening",
  anytime: "Anytime",
  morning_and_evening: "Morning & evening",
}

const APPLICATION_FREQUENCY_LABEL: Record<ApplicationFrequency, string> = {
  once_daily: "Once daily",
  twice_daily: "Twice daily",
  as_needed: "As needed",
  few_times_weekly: "Few times weekly",
  weekly: "Weekly",
}

export function formatApplicationTime(time: ApplicationTime) {
  return APPLICATION_TIME_LABEL[time]
}

export function formatApplicationFrequency(frequency: ApplicationFrequency) {
  return APPLICATION_FREQUENCY_LABEL[frequency]
}

export function formatApplicationSchedule(
  time: ApplicationTime | undefined,
  frequency: ApplicationFrequency | undefined,
) {
  if (!time || !frequency) return null
  return `${formatApplicationTime(time)} · ${formatApplicationFrequency(frequency)}`
}
