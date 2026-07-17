"use client"

// Audit Logs tab — a real table over AuditLog rows (lib/backend/report-store.ts's
// listAuditLogs), with client-side search/filter and a CSV export of
// whatever's currently filtered. Every row already exists because an admin
// action succeeded (saveAuditLog is only ever called after a mutation
// completes — see app/(dashboard)/settings/product-actions.ts and friends),
// so "Result: Success" is an honest label, not an invented field. Toolbar
// and table card layout mirror the established pattern in
// components/report/reports-table.tsx.
import { useMemo, useState } from "react"
import { IconDownload, IconHistory, IconSearch } from "@tabler/icons-react"

import type { AuditLogEntry } from "@/lib/backend/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <p className="flex items-center gap-2 text-xs font-semibold tracking-widest text-primary uppercase">
            <IconHistory className="size-4" />
            Audit Logs
          </p>
          <CardTitle className="mt-2">Admin action history</CardTitle>
          <CardDescription className="mt-2 max-w-3xl leading-6">
            Real AuditLog rows from PostgreSQL, newest first (most recent 500). Every row here is written only
            after an action already succeeded, so Result always reads Success — there is no failure-logging
            path yet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
            <label className="relative">
              <IconSearch className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by user or action"
                className="h-10 w-full rounded-md border border-input bg-background pr-3 pl-9 text-sm"
              />
            </label>
            <select
              value={actionFilter}
              onChange={(event) => setActionFilter(event.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="all">All actions</option>
              {actionOptions.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
            <Button type="button" variant="outline" onClick={() => downloadCsv(filtered)} disabled={filtered.length === 0}>
              <IconDownload className="size-4" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardContent className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{filtered.length}</span>
          <span>of</span>
          <span className="font-medium text-foreground">{entries.length}</span>
          <span>events shown</span>
        </CardContent>
      </Card>

      <AuditTable entries={filtered} total={entries.length} />
    </div>
  )
}

function AuditTable({ entries, total }: { entries: AuditLogEntry[]; total: number }) {
  if (total === 0) {
    return (
      <Card>
        <CardContent className="text-sm text-muted-foreground">No audit events have been recorded yet.</CardContent>
      </Card>
    )
  }

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="text-sm text-muted-foreground">No audit events match this search or filter.</CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden py-0">
      <div className="overflow-x-auto">
        <Table className="min-w-[900px]">
          <TableHeader className="sticky top-0 z-10 bg-muted">
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
              <TableRow key={entry.id}>
                <TableCell className="whitespace-nowrap">{new Date(entry.createdAt).toLocaleString()}</TableCell>
                <TableCell>{describeActor(entry)}</TableCell>
                <TableCell>{entry.action}</TableCell>
                <TableCell className="capitalize">{entry.targetType}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="border-success/30 bg-success/10 text-success">
                    Success
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
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
