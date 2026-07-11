import { redirect } from "next/navigation"

// /admin used to be one page holding everything (metrics, scans/reports
// table, user data indirectly via report rows). That content now lives at
// /admin/analytics, split out alongside the new /admin/users and
// /admin/scans sections — this bare route just forwards old links/bookmarks.
export default function AdminIndexPage() {
  redirect("/admin/analytics")
}
