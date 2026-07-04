import { headers } from "next/headers"

import { ProductForm } from "@/components/admin/product-form"
import { TokenGrantForm } from "@/components/admin/token-grant-form"
import { UsersTable } from "@/components/admin/users-table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { auth } from "@/lib/auth/server"
import { requireAdmin } from "@/lib/auth/session"
import { listProductsAction } from "@/lib/products/actions"

export default async function AdminPage() {
  await requireAdmin()

  const usersResult = await auth.api.listUsers({
    query: { limit: 100 },
    headers: await headers(),
  })

  const products = await listProductsAction()

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-heading text-2xl font-medium">Admin</h1>
        <p className="text-sm text-muted-foreground">
          Manage users, token grants, and the product catalog.
        </p>
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="tokens">Tokens</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
        </TabsList>
        <TabsContent value="users" className="pt-4">
          <UsersTable initialUsers={(usersResult?.users ?? []) as Parameters<typeof UsersTable>[0]["initialUsers"]} />
        </TabsContent>
        <TabsContent value="tokens" className="pt-4">
          <TokenGrantForm />
        </TabsContent>
        <TabsContent value="products" className="space-y-6 pt-4">
          <ProductForm />
          <ul className="space-y-2 text-sm">
            {products.map((p) => (
              <li key={p.id} className="rounded-md border border-border px-3 py-2">
                <span className="font-medium">{p.name}</span>
                <span className="text-muted-foreground"> — {p.sku}</span>
              </li>
            ))}
          </ul>
        </TabsContent>
      </Tabs>
    </div>
  )
}
