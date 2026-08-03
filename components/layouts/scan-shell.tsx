// Chrome for the (scan) route group — not the marketing nav (see AGENTS.md's
// route-group table). Deliberately minimal: the pinned header (brand link,
// Upload/Camera/Advice tabs, Dashboard link) now lives inside
// components/scan/ScanFlow.tsx instead of here, since its content is driven
// entirely by ScanFlow's own tab/step state — that state can't flow up into
// a separate layout-level shell without real cross-boundary plumbing, and
// ScanShell has exactly one consumer (app/(scan)/scan/page.tsx) today, so
// there's no shared-across-pages header to keep here. This still exists as
// the group's one shell per AGENTS.md convention, just with less to do.
export function ScanShell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-svh bg-background">{children}</div>
}
