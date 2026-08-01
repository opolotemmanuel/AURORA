"use client"

// Audit Logs tab — a real table over AuditLog rows (lib/backend/report-store.ts's
// listAuditLogs), with client-side search/filter/sort and a CSV export of
// whatever's currently filtered. Every row already exists because an admin
// action succeeded (saveAuditLog is only ever called after a mutation
// completes — see app/(dashboard)/settings/product-actions.ts and friends),
// so "Result: Success" is an honest label, not an invented field.
// Console-style redesign: shared toolbar, a removable action-type filter
// chip (same in-memory filter as before, just reskinned off the old
// <select>), sortable headers, and client-side pagination — all over the
// same up-to-500-row `entries` array already passed in as a prop.
import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { IconHistory, IconSearch } from "@tabler/icons-react"

import type { AuditLogEntry } from "@/lib/backend/types"
import { downloadCsv } from "@/lib/csv-export"
import { SingleSelectFilterChips } from "@/components/admin/filter-chip-bar"
import { PaginationFooter } from "@/components/admin/pagination-footer"
import { SortableHeader } from "@/components/admin/sortable-header"
import { ConsoleToolbar } from "@/components/admin/settings/console-toolbar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const PAGE_SIZE = 25

type SortKey = "createdAt" | "actor" | "action" | "targetType"
type SortState = { key: SortKey; direction: "asc" | "desc" } | null

export function AuditLogPanel({ entries }: { entries: AuditLogEntry[] }) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [actionFilter, setActionFilter] = useState("all")
  const [sort, setSort] = useState<SortState>(null)
  const [page, setPage] = useState(1)

  const actionOptions = useMemo(() => {
    const unique = new Set(entries.map((entry) => entry.action))
    return Array.from(unique)
      .sort()
      .map((action) => ({ value: action, label: action }))
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

  const sorted = useMemo(() => {
    if (!sort) return filtered
    const { key, direction } = sort
    const factor = direction === "asc" ? 1 : -1

    return [...filtered].sort((a, b) => {
      const aValue = key === "actor" ? describeActor(a) : a[key]
      const bValue = key === "actor" ? describeActor(b) : b[key]
      return String(aValue).localeCompare(String(bValue)) * factor
    })
  }, [filtered, sort])

  const pageCount = Math.max(Math.ceil(sorted.length / PAGE_SIZE), 1)
  const currentPage = Math.min(page, pageCount)
  const pageStart = (currentPage - 1) * PAGE_SIZE
  const pageItems = sorted.slice(pageStart, pageStart + PAGE_SIZE)

  function toggleSort(key: SortKey) {
    setPage(1)
    setSort((current) => {
      if (!current || current.key !== key) return { key, direction: "asc" }
      if (current.direction === "asc") return { key, direction: "desc" }
      return null
    })
  }

  function handleExport() {
    downloadCsv(
      `audit-log-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Time", "User", "Action", "Module", "Result"],
      sorted.map((entry) => [entry.createdAt, describeActor(entry), entry.action, entry.targetType, "Success"]),
    )
  }

  function headerProps(key: SortKey) {
    return {
      active: sort?.key === key,
      direction: sort?.key === key ? sort.direction : undefined,
      onSort: () => toggleSort(key),
    }
  }

  return (
    <div className="space-y-5">
      <ConsoleToolbar
        icon={IconHistory}
        eyebrow="Audit Logs"
        breadcrumb={[{ label: "Settings", href: "/settings" }, { label: "Audit Logs" }]}
        title="Admin action history"
        description="Real AuditLog rows from PostgreSQL, newest first (most recent 500). Every row here is written only after an action already succeeded, so Result always reads Success — there is no failure-logging path yet."
        onRefresh={() => router.refresh()}
        onExport={handleExport}
        exportDisabled={sorted.length === 0}
      >
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <label className="relative">
            <IconSearch className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => {
                setPage(1)
                setSearch(event.target.value)
              }}
              placeholder="Search by user or action"
              className="h-10 w-full rounded-md border border-input bg-background pr-3 pl-9 text-sm"
            />
          </label>
          <SingleSelectFilterChips
            value={actionFilter}
            options={actionOptions}
            onChange={(value) => {
              setPage(1)
              setActionFilter(value)
            }}
            addLabel="Action"
          />
        </div>
      </ConsoleToolbar>

      <AuditTable entries={pageItems} total={entries.length} matching={sorted.length} headerProps={headerProps} />

      {entries.length > 0 ? (
        <PaginationFooter
          start={sorted.length === 0 ? 0 : pageStart + 1}
          end={Math.min(pageStart + PAGE_SIZE, sorted.length)}
          total={sorted.length}
          itemLabel="events"
          page={currentPage}
          pageCount={pageCount}
          prev={currentPage > 1 ? { onClick: () => setPage(currentPage - 1) } : null}
          next={currentPage < pageCount ? { onClick: () => setPage(currentPage + 1) } : null}
        />
      ) : null}
    </div>
  )
}

function AuditTable({
  entries,
  total,
  matching,
  headerProps,
}: {
  entries: AuditLogEntry[]
  total: number
  matching: number
  headerProps: (key: SortKey) => { active: boolean; direction?: "asc" | "desc"; onSort: () => void }
}) {
  if (total === 0) {
    return (
      <Card>
        <CardContent className="text-sm text-muted-foreground">No audit events have been recorded yet.</CardContent>
      </Card>
    )
  }

  if (matching === 0) {
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
              <SortableHeader label="Time" {...headerProps("createdAt")} />
              <SortableHeader label="User" {...headerProps("actor")} />
              <SortableHeader label="Action" {...headerProps("action")} />
              <SortableHeader label="Module" {...headerProps("targetType")} />
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
