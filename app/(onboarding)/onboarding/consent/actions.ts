"use server"

// Records the signed-in user's one-time scan consent acknowledgment —
// re-checks the session here since server actions are callable directly,
// same reasoning as app/(dashboard)/account/allergies-actions.ts. This is
// the only thing this flow persists: location itself is never recorded
// server-side (see lib/scan/geolocation.ts's doc comment) — there's
// nothing meaningful to store about a browser permission grant, only the
// consent acknowledgment has a real, one-time, per-account meaning.
import { revalidatePath } from "next/cache"

import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db"

export async function recordScanConsent(): Promise<{ success: true } | { success: false; error: string }> {
  const session = await getSession()
  if (!session) {
    return { success: false, error: "You must be signed in to continue." }
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { scanConsentGivenAt: new Date() },
  })

  // /scan reads scanConsentGivenAt server-side on every visit to decide
  // whether to redirect here — without this, a signed-in user who just
  // consented would still see a stale cached "not yet consented" render
  // if they'd loaded /scan earlier in the same session.
  revalidatePath("/scan")

  return { success: true }
}
