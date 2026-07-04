import { ProductForm } from "@/components/admin/product-form"
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
        description="Manage the Aurora product catalog."
        badge="Admin"
      />
      <div className="grid gap-8 lg:grid-cols-2">
        <ProductForm />
        <div className="rounded-xl border border-border p-5">
          <h2 className="font-heading text-sm font-medium">Catalog</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {products.length === 0 ? (
              <li className="text-muted-foreground">No products yet.</li>
            ) : (
              products.map((p) => (
                <li key={p.id} className="rounded-lg border border-border px-3 py-2">
                  <span className="font-medium">{p.name}</span>
                  <span className="text-muted-foreground"> — {p.sku}</span>
                  {!p.isActive ? (
                    <span className="ml-2 text-xs text-muted-foreground">(inactive)</span>
                  ) : null}
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}
