"use server"

// Server action backing the Users table's delete button
// (components/admin/delete-user-dialog.tsx). Same shape as
// app/(dashboard)/settings/product-actions.ts: re-check admin access here
// (this is directly callable, not just reachable through the page that
// renders its triggering button) -> do the mutation -> audit log ->
// revalidate.
import { revalidatePath } from "next/cache"

import { deleteUserAccount, type DeleteUserResult } from "@/lib/backend/admin-users"
import { saveAuditLog } from "@/lib/backend/report-store"
import { requireAdminAccess } from "@/lib/auth/admin"

export async function deleteUserAccountAction(targetUserId: string): Promise<DeleteUserResult> {
  const auth = await requireAdminAccess("users:delete")

  const result = await deleteUserAccount({ targetUserId, callerId: auth.principal.id })

  if (!result.success) {
    return result
  }

  await saveAuditLog({
    actorId: auth.principal.id,
    actorRole: auth.principal.role,
    action: `Deleted user account (${result.deletedUser.email})`,
    targetType: "admin",
    targetId: result.deletedUser.id,
  })

  revalidatePath("/admin/users")

  return result
}
