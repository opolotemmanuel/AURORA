import type { UserLocation } from "@/generated/prisma/client"

import {
  fetchClimateSnapshot,
  type ClimateSnapshot,
} from "@/lib/climate/sync"
import { prisma } from "@/lib/db/client"
import {
  resolveCoordinates,
  type ResolveCoordinatesInput,
} from "@/lib/location/resolve-coordinates"
import type { ScanClimateContext } from "@/lib/scan/types"

type LocationClimateFields = Pick<
  UserLocation,
  | "city"
  | "region"
  | "country"
  | "uvIndexBand"
  | "humidityBand"
  | "temperatureBand"
  | "climateZone"
  | "seasonBand"
  | "lastSyncedAt"
>

export function toScanClimateContext(
  location: LocationClimateFields | null,
): ScanClimateContext | null {
  if (!location) return null

  const hasClimate =
    location.uvIndexBand != null ||
    location.humidityBand != null ||
    location.temperatureBand != null ||
    location.climateZone != null ||
    location.seasonBand != null

  const hasPlace =
    Boolean(location.city) ||
    Boolean(location.region) ||
    Boolean(location.country)

  if (!hasClimate && !hasPlace) return null

  return {
    city: location.city,
    region: location.region,
    country: location.country,
    uvIndexBand: location.uvIndexBand,
    humidityBand: location.humidityBand,
    temperatureBand: location.temperatureBand,
    climateZone: location.climateZone,
    seasonBand: location.seasonBand,
    syncedAt: location.lastSyncedAt?.toISOString() ?? null,
  }
}

export function toLocationSnapshot(location: LocationClimateFields | null) {
  const context = toScanClimateContext(location)
  if (!context) return undefined

  return {
    city: context.city,
    region: context.region,
    country: context.country,
    uvIndexBand: context.uvIndexBand,
    humidityBand: context.humidityBand,
    temperatureBand: context.temperatureBand,
    climateZone: context.climateZone,
    seasonBand: context.seasonBand,
    syncedAt: context.syncedAt,
  }
}

export async function refreshClimateForPlace(
  input: ResolveCoordinatesInput,
): Promise<{
  climate: ClimateSnapshot
  latitude: number
  longitude: number
} | null> {
  const coords = await resolveCoordinates(input)
  if (!coords) return null

  const climate = await fetchClimateSnapshot(coords.latitude, coords.longitude)
  return { climate, ...coords }
}

function hasResolvablePlace(input: ResolveCoordinatesInput): boolean {
  return (
    Boolean(input.city?.trim()) ||
    Boolean(input.region?.trim()) ||
    Boolean(input.country?.trim()) ||
    (input.latitude != null && input.longitude != null)
  )
}

export async function ensureClimateForScan(
  userId: string,
): Promise<UserLocation | null> {
  const location = await prisma.userLocation.findUnique({ where: { userId } })
  if (!location || !hasResolvablePlace(location)) return location

  try {
    const refreshed = await refreshClimateForPlace(location)
    if (!refreshed) return location

    return prisma.userLocation.update({
      where: { userId },
      data: {
        ...refreshed.climate,
        latitude: refreshed.latitude,
        longitude: refreshed.longitude,
        lastSyncedAt: new Date(),
      },
    })
  } catch {
    return location
  }
}

export function parseLocationSnapshot(
  value: unknown,
): ScanClimateContext | null {
  if (!value || typeof value !== "object") return null

  const record = value as Record<string, unknown>
  return {
    city: typeof record.city === "string" ? record.city : null,
    region: typeof record.region === "string" ? record.region : null,
    country: typeof record.country === "string" ? record.country : null,
    uvIndexBand:
      typeof record.uvIndexBand === "string" ? record.uvIndexBand : null,
    humidityBand:
      typeof record.humidityBand === "string" ? record.humidityBand : null,
    temperatureBand:
      typeof record.temperatureBand === "string"
        ? record.temperatureBand
        : null,
    climateZone:
      typeof record.climateZone === "string" ? record.climateZone : null,
    seasonBand:
      typeof record.seasonBand === "string" ? record.seasonBand : null,
    syncedAt: typeof record.syncedAt === "string" ? record.syncedAt : null,
  }
}
