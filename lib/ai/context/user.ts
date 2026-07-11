import { unstable_cache } from "next/cache"
import { cache } from "react"

import {
  USER_SCAN_CONTEXT_REVALIDATE_SECONDS,
  userScanContextTag,
} from "@/lib/ai/context/cache-tags"
import { prisma } from "@/lib/db/client"
import type { UserScanContext } from "@/lib/ai/types"

async function fetchUserScanContext(userId: string): Promise<UserScanContext> {
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
          skinDosha: profile.skinDosha,
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

export const getUserScanContext = cache(
  async (userId: string): Promise<UserScanContext> => {
    return unstable_cache(
      () => fetchUserScanContext(userId),
      ["user-scan-context", userId],
      {
        tags: [userScanContextTag(userId)],
        revalidate: USER_SCAN_CONTEXT_REVALIDATE_SECONDS,
      },
    )()
  },
)
