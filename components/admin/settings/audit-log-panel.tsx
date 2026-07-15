"use client"

// Audit Logs tab — a real table over AuditLog rows (lib/backend/report-store.ts's
// listAuditLogs), with client-side search/filter and a CSV export of
// whatever's currently filtered. Every row already exists because an admin
// action succeeded (saveAuditLog is only ever called after a mutation
// completes — see app/(dashboard)/settings/product-actions.ts and friends),
// so "Result: Success" is an honest label, not an invented field.
import { useMemo, useState } from "react"
import { IconDownload, IconHistory } from "@tabler/icons-react"

import type { AuditLogEntry } from "@/lib/backend/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function AuditLogPanel({ entries }: { entries: AuditLogEntry[] }) {
  const [search, setSearch] = useState("")
  const [actionFilter, setActionFilter] = useState("all")

  const actionOptions = useMemo(() => {
    const unique = new Set(entries.map((entry) => entry.action))
    return Array.from(unique).sort()
  }, [entries])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()

    return entries.filter((entry) => {
      if (actionFilter !== "all" && entry.action !== actionFilter) return false
      if (!query) return true

      const haystack = [entry.actorName, entry.actorEmail, entry.actorId, entry.action]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      return haystack.includes(query)
    })
  }, [entries, search, actionFilter])

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0 border-b border-border pb-(--card-spacing) sm:flex-row">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold tracking-widest text-primary uppercase">
            <IconHistory className="size-4" />
            Audit Logs
          </p>
          <CardTitle className="mt-2">Admin action history</CardTitle>
          <CardDescription className="mt-2 max-w-3xl leading-6">
            Real AuditLog rows from PostgreSQL, newest first (most recent 500). Every row here is written only
            after an action already succeeded, so Result always reads Success — there is no failure-logging path
            yet.
          </CardDescription>
        </div>
        <Button type="button" variant="outline" onClick={() => downloadCsv(filtered)} disabled={filtered.length === 0}>
          <IconDownload className="size-4" />
          Export CSV
        </Button>
      </CardHeader>

      <CardContent className="grid gap-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <Input
            placeholder="Search by user or action..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select
            value={actionFilter}
            onChange={(event) => setActionFilter(event.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">All actions</option>
            {actionOptions.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
        </div>

        <AuditTable entries={filtered} total={entries.length} />
      </CardContent>
    </Card>
  )
}

function AuditTable({ entries, total }: { entries: AuditLogEntry[]; total: number }) {
  if (total === 0) {
    return (
      <div className="rounded-lg border border-border bg-muted p-4 text-sm text-muted-foreground">
        No audit events have been recorded yet.
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-muted p-4 text-sm text-muted-foreground">
        No audit events match this search or filter.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-muted">
      <div className="overflow-x-auto">
        <Table className="min-w-[900px]">
          <TableHeader className="sticky top-0 z-10 bg-card">
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Module</TableHead>
              <TableHead>Result</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={entry.id} className="bg-background">
                <TableCell className="whitespace-nowrap">{new Date(entry.createdAt).toLocaleString()}</TableCell>
                <TableCell>{describeActor(entry)}</TableCell>
                <TableCell>{entry.action}</TableCell>
                <TableCell className="capitalize">{entry.targetType}</TableCell>
                <TableCell>
                  <Badge variant="default">Success</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function describeActor(entry: AuditLogEntry) {
  if (entry.actorName) return entry.actorName
  if (entry.actorEmail) return entry.actorEmail
  if (entry.actorId) return entry.actorId
  return "System"
}

function downloadCsv(entries: AuditLogEntry[]) {
  const header = ["Time", "User", "Action", "Module", "Result"]
  const rows = entries.map((entry) => [
    entry.createdAt,
    describeActor(entry),
    entry.action,
    entry.targetType,
    "Success",
  ])

  const csv = [header, ...rows]
    .map((row) => row.map(escapeCsvCell).join(","))
    .join("\n")

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

function escapeCsvCell(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}
