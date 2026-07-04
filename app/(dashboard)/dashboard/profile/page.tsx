import { ProfileEditor } from "@/components/dashboard/profile-editor"
import { DashboardPageHeader } from "@/components/dashboard/page-header"
import { requireSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db/client"

export default async function ProfilePage() {
  const session = await requireSession()
  const [profile, location] = await Promise.all([
    prisma.userProfile.findUnique({ where: { userId: session.user.id } }),
    prisma.userLocation.findUnique({ where: { userId: session.user.id } }),
  ])

  const lifestyle = (profile?.lifestyleFactors ?? {}) as Record<string, string>
  const routine = (profile?.currentRoutine ?? {}) as Record<string, string>

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        title="Profile"
        description="Update your wellness profile, routine, and location. Cosmetic self-report only — not a medical record."
      />
      <ProfileEditor
        profile={{
          name: session.user.name,
          dateOfBirth: profile?.dateOfBirth?.toISOString().slice(0, 10) ?? "",
          biologicalSex: profile?.biologicalSex ?? "",
          skinType: profile?.skinType ?? "",
          fitzpatrickBand: profile?.fitzpatrickBand ?? "",
          primaryConcerns: profile?.primaryConcerns ?? [],
          skinGoals: profile?.skinGoals ?? [],
          allergies: profile?.allergies ?? "",
          routineAm: routine.am ?? "",
          routinePm: routine.pm ?? "",
          sunExposure: lifestyle.sunExposure ?? "moderate",
          smoking: lifestyle.smoking ?? "never",
          sleepHours: lifestyle.sleepHours ?? "7_to_8",
          waterIntake: lifestyle.waterIntake ?? "moderate",
          city: location?.city ?? "",
          region: location?.region ?? "",
          country: location?.country ?? "",
        }}
      />
    </div>
  )
}
