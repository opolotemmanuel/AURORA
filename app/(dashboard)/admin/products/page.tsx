import { Suspense } from "react"

import { ProductsAdminLoader } from "@/components/admin/products-admin-loader"
import { DashboardPageHeader } from "@/components/dashboard/page-header"
import { Skeleton } from "@/components/ui/skeleton"

function ProductsAdminSkeleton() {
  return (
    <div className="space-y-4 rounded-xl border border-border p-5">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-64" />
          </div>
          <Skeleton className="h-8 w-16 rounded-lg" />
        </div>
      ))}
    </div>
  )
}

export default function AdminProductsPage() {
  return (
    <div className="space-y-8">
      <DashboardPageHeader
        title="Products"
        description="Manage the Aurora product catalog and recommendation matching fields."
        badge="Admin"
      />
      <Suspense fallback={<ProductsAdminSkeleton />}>
        <ProductsAdminLoader />
      </Suspense>
    </div>
  )
}
