// Zero-fills lib/backend/report-store.ts's getScanCountsByDayForUser rows
// into one point per day across the full window, so the dashboard's usage
// chart never has to guess whether a missing day means "zero scans" or
// "not fetched yet".
//
// Deliberately all-UTC arithmetic (setUTCDate/getUTCDate, never the local-
// time setDate/getDate/setHours) — the DB side buckets by
// date_trunc('day', "createdAt") under Postgres's session timezone, which
// is UTC (confirmed via `SHOW timezone`), so the JS-side day boundaries
// have to be computed in UTC too or the two disagree. Mixing local-time
// Date mutations with toISOString()'s UTC-formatted output is exactly what
// caused a real, observed bug here during verification: on a server whose
// local timezone is ahead of UTC (e.g. EAT, UTC+3), local midnight for
// "today" converts to UTC as still being "yesterday", so a scan created
// today under the DB's UTC bucket ("2026-07-23") would silently miss the
// locally-generated series' key for that same day (mislabeled
// "2026-07-22") and render as if no scan had happened. Every date_trunc-
// keyed day series in this app should use this same all-UTC approach.
export function buildDailyScanSeries(rows: { day: Date; count: number }[], days: number): { date: string; count: number }[] {
  const countsByDate = new Map(rows.map((row) => [toDateKey(row.day), row.count]))
  const start = getStartOfDayNDaysAgo(days)

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(start)
    date.setUTCDate(start.getUTCDate() + index)
    const key = toDateKey(date)
    return { date: key, count: countsByDate.get(key) ?? 0 }
  })
}

export function getStartOfDayNDaysAgo(days: number): Date {
  const date = new Date()
  date.setUTCHours(0, 0, 0, 0)
  date.setUTCDate(date.getUTCDate() - (days - 1))
  return date
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10)
}
