// Read-side for the signed-in user's one-time scan consent acknowledgment.
// Not declared in lib/auth/auth.ts's additionalFields (unlike role/
// lastLoginAt), so it isn't exposed on the better-auth session object —
// same reasoning as lib/user/allergies-store.ts's getUserAllergies: a
// small, explicit query instead of growing the session payload for a
// field only a couple of server-side checks need. The actual write lives
// in app/(onboarding)/onboarding/consent/actions.ts's recordScanConsent.
import { prisma } from "@/lib/db"

export async function getScanConsentGivenAt(userId: string): Promise<Date | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { scanConsentGivenAt: true },
  })

  return user?.scanConsentGivenAt ?? null
}
