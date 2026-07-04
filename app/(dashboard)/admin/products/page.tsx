import { ProductsAdminClient } from "@/components/admin/products-admin-client"
import { DashboardPageHeader } from "@/components/dashboard/page-header"
import { requireAdmin } from "@/lib/auth/session"
import { listProductsAction } from "@/lib/products/actions"

export default async function AdminProductsPage() {
  await requireAdmin()
  const products = await listProductsAction()

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        title="Products"
        description="Manage the Aurora product catalog and recommendation matching fields."
        badge="Admin"
      />
      <ProductsAdminClient products={products} />
    </div>
  )
}
