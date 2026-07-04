"use client"

import { useState } from "react"

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/motion/tabs"
import { useTabSearchParam } from "@/hooks/use-tab-search-param"
import {
  deleteAccountAction,
  deleteAllPersonalDataAction,
  deleteAllScansAction,
  deleteLocationDataAction,
  deleteProfileDataAction,
  deleteScanAction,
} from "@/lib/user/data-actions"

const PRIVACY_TABS = ["data", "scans", "account"] as const

export function PrivacyControls({
  scans,
}: {
  scans: { id: string; status: string; createdAt: string }[]
}) {
  const [tab, setTab, tabPending] = useTabSearchParam(PRIVACY_TABS, "data")
  const [actionPending, setActionPending] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function run(action: () => Promise<void>, key: string) {
    setActionPending(key)
    setMessage(null)
    try {
      await action()
      setMessage("Done.")
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Action failed")
    } finally {
      setActionPending(null)
    }
  }

  return (
    <Tabs value={tab} onValueChange={setTab} variant="underline" className="w-full">
      <TabsList className="w-full flex-wrap gap-x-1 gap-y-0">
        <TabsTrigger value="data" pending={tabPending === "data"}>Your data</TabsTrigger>
        <TabsTrigger value="scans" pending={tabPending === "scans"}>Scans</TabsTrigger>
        <TabsTrigger value="account" pending={tabPending === "account"}>Account</TabsTrigger>
      </TabsList>

      <TabsContent value="data" pending={tabPending === "data"}>
        <div className="space-y-4">
          <PrivacyAction
            title="Profile & wellness data"
            description="Clears skin profile, routine, prescriptions, and lifestyle fields. Your account stays active."
            confirmLabel="Delete profile data"
            pending={actionPending === "profile"}
            onConfirm={() => run(deleteProfileDataAction, "profile")}
          />
          <PrivacyAction
            title="Location & climate cache"
            description="Removes city, coordinates, and cached climate bands."
            confirmLabel="Delete location"
            pending={actionPending === "location"}
            onConfirm={() => run(deleteLocationDataAction, "location")}
          />
        </div>
      </TabsContent>

      <TabsContent value="scans" pending={tabPending === "scans"}>
        <div className="space-y-4">
          <PrivacyAction
            title="All scans & reports"
            description="Permanently deletes every scan and associated results for your account."
            confirmLabel="Delete all scans"
            pending={actionPending === "scans"}
            onConfirm={() => run(deleteAllScansAction, "scans")}
            destructive
          />

          {scans.length > 0 ? (
            <div className="rounded-xl border border-border p-4">
              <h3 className="font-heading text-sm font-medium">Individual scans</h3>
              <ul className="mt-3 space-y-2">
                {scans.map((scan) => (
                  <li
                    key={scan.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm"
                  >
                    <span className="text-muted-foreground">
                      {new Date(scan.createdAt).toLocaleDateString()} — {scan.status}
                    </span>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this scan?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This removes the scan and any stored results. This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => run(() => deleteScanAction(scan.id), scan.id)}
                          >
                            Delete scan
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No scans to delete.</p>
          )}
        </div>
      </TabsContent>

      <TabsContent value="account" pending={tabPending === "account"}>
        <div className="space-y-4">
          <PrivacyAction
            title="All personal data"
            description="Deletes profile, location, scans, and token history. Account remains for sign-in."
            confirmLabel="Delete all personal data"
            pending={actionPending === "all"}
            onConfirm={() => run(deleteAllPersonalDataAction, "all")}
            destructive
          />
          <PrivacyAction
            title="Delete account"
            description="Permanently deletes your account and all associated data. You will be signed out."
            confirmLabel="Delete my account"
            pending={actionPending === "account"}
            onConfirm={() => run(deleteAccountAction, "account")}
            destructive
          />
        </div>
      </TabsContent>

      {message ? <p className="mt-4 text-sm text-muted-foreground">{message}</p> : null}
    </Tabs>
  )
}

function PrivacyAction({
  title,
  description,
  confirmLabel,
  onConfirm,
  pending,
  destructive,
}: {
  title: string
  description: string
  confirmLabel: string
  onConfirm: () => void
  pending: boolean
  destructive?: boolean
}) {
  return (
    <div className="rounded-xl border border-border p-4">
      <h3 className="font-heading text-sm font-medium">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            className="mt-3"
            size="sm"
            variant={destructive ? "destructive" : "outline"}
            disabled={pending}
          >
            {pending ? "Working…" : confirmLabel}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmLabel}?</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirm}>{confirmLabel}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
