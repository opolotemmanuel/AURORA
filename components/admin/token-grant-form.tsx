"use client"

import { useMemo, useState, useTransition } from "react"

import type { TokenGrantUser } from "@/components/admin/token-grant-panel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { grantAdminTokensAction } from "@/lib/admin/actions"

function formatUserLabel(user: TokenGrantUser): string {
  const name = user.name?.trim() || "Unnamed"
  return `${name} — ${user.email} (${user.balance.toLocaleString()} credits)`
}

export function TokenGrantForm({ users }: { users: TokenGrantUser[] }) {
  const [userId, setUserId] = useState("")
  const [amount, setAmount] = useState("1000")
  const [reason, setReason] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const selectedUser = useMemo(
    () => users.find((user) => user.id === userId),
    [users, userId],
  )

  return (
    <form
      className="w-full space-y-4 rounded-none border border-border p-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (!userId) return

        startTransition(async () => {
          try {
            await grantAdminTokensAction({
              userId,
              amount: Number.parseInt(amount, 10),
              reason,
            })
            setMessage("Tokens granted successfully.")
            setAmount("1000")
            setReason("")
          } catch (err) {
            setMessage(err instanceof Error ? err.message : "Grant failed")
          }
        })
      }}
    >
      <h2 className="font-heading text-lg font-medium">Grant tokens</h2>
      <div className="space-y-2">
        <Label htmlFor="userId">User</Label>
        <Select value={userId} onValueChange={setUserId} required>
          <SelectTrigger id="userId" className="w-full">
            <SelectValue placeholder="Select a user" />
          </SelectTrigger>
          <SelectContent>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {formatUserLabel(user)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedUser ? (
          <p className="text-sm text-muted-foreground">
            Current balance: {selectedUser.balance.toLocaleString()} credits
          </p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="amount">Amount</Label>
        <Input
          id="amount"
          type="number"
          min={1}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="reason">Reason (optional)</Label>
        <Input
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={pending || !userId}>
        {pending ? "Granting…" : "Grant tokens"}
      </Button>
      {message ? (
        <p className="text-sm text-muted-foreground">{message}</p>
      ) : null}
    </form>
  )
}
