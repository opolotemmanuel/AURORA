"use client"

// Confirmation dialog for the Users table's per-row delete action — the
// only place app/(dashboard)/admin/users/user-actions.ts's
// deleteUserAccountAction gets called from. A plain icon button here would
// let one misclick permanently delete an account and everything under it,
// so this always requires an explicit, clearly-labeled destructive
// confirm — never a bare window.confirm.
import { useState, useTransition } from "react"
import { IconLoader2, IconTrash } from "@tabler/icons-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { deleteUserAccountAction } from "@/app/(dashboard)/admin/users/user-actions"

type DialogUser = { id: string; name?: string; email: string }

export function DeleteUserDialog({
  user,
  disabled,
  disabledReason,
  onDeleted,
}: {
  user: DialogUser
  disabled: boolean
  disabledReason?: string
  onDeleted: (userId: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (disabled) {
    return (
      <Button variant="destructive" size="icon" disabled title={disabledReason}>
        <IconTrash className="size-4" />
      </Button>
    )
  }

  function handleConfirm() {
    setError(null)
    startTransition(async () => {
      const result = await deleteUserAccountAction(user.id)

      if (!result.success) {
        setError(result.error)
        return
      }

      setOpen(false)
      onDeleted(user.id)
    })
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!isPending) setOpen(next)
      }}
    >
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="icon" title="Delete user">
          <IconTrash className="size-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {user.name ?? user.email}?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes <span className="font-medium text-foreground">{user.email}</span>&apos;s
            account, along with all of their scans, reports, and chat history. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending}
            onClick={(event) => {
              event.preventDefault()
              handleConfirm()
            }}
          >
            {isPending ? <IconLoader2 className="size-4 animate-spin" /> : null}
            Delete account
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
