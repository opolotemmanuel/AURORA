import { Suspense } from "react"

import { PricingReferenceCard } from "@/components/admin/pricing-reference-card"
import { TokenGrantPanel } from "@/components/admin/token-grant-panel"
import { DashboardPageHeader } from "@/components/dashboard/page-header"
import { Skeleton } from "@/components/ui/skeleton"

function TokenGrantSkeleton() {
  return (
    <div className="space-y-4 rounded-lg border border-border p-4">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-9 w-28" />
    </div>
  )
}

export default function AdminTokensPage() {
  return (
    <div className="space-y-8">
      <DashboardPageHeader
        title="Tokens"
        description="Grant simulated credits to users for scans and AI usage."
        badge="Admin"
      />
      <Suspense fallback={<TokenGrantSkeleton />}>
        <TokenGrantPanel />
      </Suspense>
      <Suspense fallback={<TokenGrantSkeleton />}>
        <PricingReferenceCard />
      </Suspense>
    </div>
  )
}
