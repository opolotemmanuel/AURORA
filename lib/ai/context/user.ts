import { prisma } from "@/lib/db/client"
import type { UserScanContext } from "@/lib/ai/types"

export async function getUserScanContext(
  userId: string,
): Promise<UserScanContext> {
  const [profile, location] = await Promise.all([
    prisma.userProfile.findUnique({ where: { userId } }),
    prisma.userLocation.findUnique({ where: { userId } }),
  ])

  return {
    profile: profile
      ? {
          ageBand: profile.ageBand,
          skinType: profile.skinType,
          fitzpatrickBand: profile.fitzpatrickBand,
          primaryConcerns: profile.primaryConcerns,
          skinGoals: profile.skinGoals,
          allergies: profile.allergies,
          currentRoutine: profile.currentRoutine,
          lifestyleFactors: profile.lifestyleFactors,
        }
      : null,
    location: location
      ? {
          city: location.city,
          region: location.region,
          country: location.country,
          uvIndexBand: location.uvIndexBand,
          humidityBand: location.humidityBand,
          temperatureBand: location.temperatureBand,
          climateZone: location.climateZone,
          seasonBand: location.seasonBand,
        }
      : null,
  }
}
