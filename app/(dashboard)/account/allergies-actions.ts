"use server"

// Updates the signed-in user's own declared allergy list — re-checks the
// session here (not just in the page that renders the form) since server
// actions are callable directly, same reasoning as
// app/(dashboard)/dosha-assessment/actions.ts. Returns a result object
// rather than redirecting, since the caller (components/account/
// allergies-form.tsx) shows inline success/error feedback in place, the
// same UX as ChangePasswordForm.
import { revalidatePath } from "next/cache"

import { getSession } from "@/lib/auth/session"
import { saveUserAllergies } from "@/lib/user/allergies-store"

const MAX_ALLERGIES_LENGTH = 500

export async function updateAllergies(
  allergies: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await getSession()
  if (!session) {
    return { success: false, error: "You must be signed in to update your allergies." }
  }

  if (allergies.length > MAX_ALLERGIES_LENGTH) {
    return { success: false, error: `Allergies must be ${MAX_ALLERGIES_LENGTH} characters or fewer.` }
  }

  await saveUserAllergies(session.user.id, allergies)
  revalidatePath("/account")

  return { success: true }
}
