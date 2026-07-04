"use client"

import { useState, useTransition } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { grantAdminTokensAction } from "@/lib/admin/actions"

export function TokenGrantForm() {
  const [userId, setUserId] = useState("")
  const [amount, setAmount] = useState("1000")
  const [reason, setReason] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  return (
    <form
      className="w-full space-y-4 rounded-lg border border-border p-4"
      onSubmit={(e) => {
        e.preventDefault()
        startTransition(async () => {
          try {
            await grantAdminTokensAction({
              userId,
              amount: Number.parseInt(amount, 10),
              reason,
            })
            setMessage("Tokens granted.")
          } catch (err) {
            setMessage(err instanceof Error ? err.message : "Grant failed")
          }
        })
      }}
    >
      <h2 className="font-heading text-lg font-medium">Grant tokens</h2>
      <div className="space-y-2">
        <Label htmlFor="userId">User ID</Label>
        <Input id="userId" value={userId} onChange={(e) => setUserId(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="amount">Amount</Label>
        <Input id="amount" type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="reason">Reason (optional)</Label>
        <Input id="reason" value={reason} onChange={(e) => setReason(e.target.value)} />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Granting…" : "Grant tokens"}
      </Button>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </form>
  )
}
