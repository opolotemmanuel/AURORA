export function ScanShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="scan-flow relative flex min-h-svh flex-col bg-background [&_[data-slot=button]]:rounded-lg">
      {children}
    </div>
  )
}
