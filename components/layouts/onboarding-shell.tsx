// Chrome for the (onboarding) route group — no navbar/sidebar, just a
// centered single-column step flow (see AGENTS.md's route-group table).
export function OnboardingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-6 py-12">
        {children}
      </main>
    </div>
  )
}
