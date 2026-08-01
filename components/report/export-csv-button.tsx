"use client"

// The only genuinely interactive piece the Scans (and Reports) table needs:
// building/downloading a CSV Blob requires the browser, so it's the one
// Client Component island inside the otherwise server-rendered
// reports-table.tsx. Props are plain already-fetched data — nothing here
// triggers a new request.
import { IconDownload } from "@tabler/icons-react"

import { downloadCsv } from "@/lib/csv-export"
import { Button } from "@/components/ui/button"

export function ExportCsvButton({
  filename,
  headers,
  rows,
  label = "Export CSV",
  disabled,
}: {
  filename: string
  headers: string[]
  rows: string[][]
  label?: string
  disabled?: boolean
}) {
  return (
    <Button type="button" variant="outline" onClick={() => downloadCsv(filename, headers, rows)} disabled={disabled}>
      <IconDownload className="size-4" />
      {label}
    </Button>
  )
}
