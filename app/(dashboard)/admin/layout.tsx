import { Suspense } from "react"

import { AdminAuthGate } from "@/components/layouts/admin-auth-gate"
import { DashboardPageSkeleton } from "@/components/dashboard/skeletons/dashboard-page-skeleton"

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <Suspense fallback={<DashboardPageSkeleton />}>
      <AdminAuthGate>{children}</AdminAuthGate>
    </Suspense>
  )
}
