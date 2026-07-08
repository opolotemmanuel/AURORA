import Image from "next/image"
import type { ComponentType } from "react"
import {
  IconBrain,
  IconBuildingStore,
  IconDatabase,
  IconFileAnalytics,
  IconKey,
  IconLock,
  IconPlus,
  IconSettings,
  IconShieldCheck,
  IconTrash,
} from "@tabler/icons-react"

import {
  activateProductAction,
  createProductAction,
  deactivateProductAction,
  deleteProductAction,
  updateProductAction,
} from "@/app/(dashboard)/settings/product-actions"
import {
  getEnterpriseSettingsModules,
  type EnterpriseSettingsModule,
  type SettingsModuleTone,
} from "@/lib/backend/settings-service"
import { listProducts } from "@/lib/backend/product-service"
import { saveAuditLog } from "@/lib/backend/report-store"
import { AdminAccessError, requireAdminAccess } from "@/lib/auth/admin"
import { AccessDenied } from "@/components/admin/access-denied"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export const dynamic = "force-dynamic"

const moduleIcons: Record<string, ComponentType<{ className?: string }>> = {
  "Core Backend": IconDatabase,
  "AI Assessment": IconBrain,
  "Reports And Downloads": IconFileAnalytics,
  "Privacy And Retention": IconShieldCheck,
  "Admin Roles And Access": IconLock,
  "Product And Recommendation Controls": IconBuildingStore,
  "Enterprise Platform Roadmap": IconSettings,
}

export default async function SettingsPage() {
  let auth
  try {
    auth = await requireAdminAccess("settings:manage")
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return <AccessDenied note={error.access.note} />
    }
    throw error
  }

  const [modules, products] = await Promise.all([getEnterpriseSettingsModules(), listProducts()])

  await saveAuditLog({
    actorId: auth.principal.id,
    actorRole: auth.principal.role,
    action: "Viewed enterprise settings dashboard",
    targetType: "admin",
    targetId: "settings",
  })

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <p className="flex items-center gap-2 text-xs font-semibold tracking-widest text-primary uppercase">
          <IconSettings className="size-4" />
          Enterprise Operations
        </p>
        <h1 className="text-3xl font-semibold tracking-normal">Settings</h1>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
          Platform configuration console for Aurora SkinSense. Live values come from server checks and
          PostgreSQL records; future capabilities are labelled as previews or roadmap phases.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <SummaryCard label="Live modules" value={countModules(modules, "Live")} detail="Backed by current server checks or records" />
        <SummaryCard label="Backend pending" value={countModules(modules, "Backend pending")} detail="Requires future backend implementation" />
        <SummaryCard label="Configuration previews" value={countPreviewModules(modules)} detail="Not presented as active settings" />
      </section>

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-3 space-y-0 border-b border-border pb-(--card-spacing)">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold tracking-widest text-primary uppercase">
              <IconBuildingStore className="size-4" />
              Product Management
            </p>
            <CardTitle className="mt-2">Aurora Products</CardTitle>
            <CardDescription className="mt-2 max-w-3xl leading-6">
              Real PostgreSQL product records used by the recommendation engine. If no active products exist,
              recommendations will return an honest empty result instead of hard-coded live data.
            </CardDescription>
          </div>
          <div className="shrink-0 rounded-lg border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
            {products.filter((product) => product.active).length} active / {products.length} total
          </div>
        </CardHeader>

        <CardContent className="grid gap-6">
          <ProductForm title="Add Product" action={createProductAction} submitLabel="Add product" />
          <ProductTable products={products} />
        </CardContent>
      </Card>

      <section className="grid gap-5 xl:grid-cols-2">
        {modules.map((module) => {
          const Icon = moduleIcons[module.title] ?? IconSettings

          return (
            <Card key={module.title}>
              <CardHeader className="flex-row items-start justify-between gap-4 space-y-0 sm:flex-row">
                <div className="flex gap-3">
                  <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted text-primary">
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <CardTitle>{module.title}</CardTitle>
                    <CardDescription className="mt-1 leading-6">{module.description}</CardDescription>
                  </div>
                </div>
                <StatusPill tone={module.tone} label={module.status} />
              </CardHeader>

              <CardContent>
                <div className="divide-y divide-border rounded-lg border border-border bg-muted">
                  {module.items.map((item) => (
                    <div key={`${module.title}-${item.label}`} className="grid gap-2 p-4 sm:grid-cols-[1fr_auto]">
                      <div>
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.detail}</p>
                      </div>
                      <span className="text-left text-sm font-semibold sm:text-right">{item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </section>

      <Card>
        <CardContent className="flex items-start gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted text-primary">
            <IconKey className="size-5" />
          </div>
          <div>
            <CardTitle>Secret Handling</CardTitle>
            <CardDescription className="mt-2 leading-6">
              This page only displays whether server-side configuration exists. It never displays
              `GEMINI_API_KEY`, `DATABASE_URL`, uploaded image data, or provider credentials.
            </CardDescription>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

type ProductRow = Awaited<ReturnType<typeof listProducts>>[number]

function ProductForm({
  title,
  action,
  submitLabel,
  product,
}: {
  title: string
  action: (formData: FormData) => void | Promise<void>
  submitLabel: string
  product?: ProductRow
}) {
  return (
    <form action={action} className="rounded-lg border border-border bg-muted p-4">
      <div className="mb-4 flex items-center gap-2">
        <IconPlus className="size-4 text-primary" />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {product ? <input type="hidden" name="id" value={product.databaseId} /> : null}
      <div className="grid gap-3">
        <Field label="Name" name="name" defaultValue={product?.name} required />
        <Field label="Slug" name="slug" defaultValue={product?.id} placeholder="auto-generated from name if empty" />
        <Field label="Category" name="category" defaultValue={product?.category} required />
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Routine step</span>
          <select
            name="routineStep"
            defaultValue={product?.routineStep ?? "treat"}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="cleanse">Cleanse</option>
            <option value="treat">Treat</option>
            <option value="moisturize">Moisturize</option>
            <option value="protect">Protect</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Short description</span>
          <textarea
            name="shortDescription"
            defaultValue={product?.shortDescription}
            required
            rows={3}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </label>
        <Field
          label="Product image path"
          name="imagePath"
          defaultValue={product?.imagePath}
          placeholder="/products/aurora-glow-serum.png"
        />
        <Field
          label="Cosmetic benefits"
          name="cosmeticBenefits"
          defaultValue={product?.cosmeticBenefits.join(", ")}
          placeholder="Hydration appearance, Radiance support"
          required
        />
        <Field
          label="Best for concerns"
          name="bestFor"
          defaultValue={product?.bestFor.join(", ")}
          placeholder="hydration, radiance, texture"
          required
        />
        <Field
          label="Avoid if concerns"
          name="avoidIf"
          defaultValue={product?.avoidIf?.join(", ")}
          placeholder="oilBalance"
        />
        <Field label="Priority" name="priority" type="number" defaultValue={String(product?.priority ?? 50)} required />
        <label className="flex items-center gap-2 text-sm">
          <Checkbox name="active" defaultChecked={product?.active ?? true} />
          Active in recommendation engine
        </label>
      </div>
      <Button type="submit" className="mt-4">
        {submitLabel}
      </Button>
    </form>
  )
}

function ProductTable({ products }: { products: ProductRow[] }) {
  if (!products.length) {
    return (
      <div className="rounded-lg border border-border bg-muted p-4 text-sm text-muted-foreground">
        No Aurora products exist in PostgreSQL yet. Add the first product to enable live recommendations.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-muted">
      <div className="hidden overflow-x-auto lg:block">
        <Table className="min-w-[1100px]">
          <TableHeader className="sticky top-0 z-10 bg-card">
            <TableRow>
              <TableHead><Checkbox aria-label="Select all products" /></TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Routine</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Recommendations</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.databaseId} className="bg-background">
                <TableCell><Checkbox aria-label={`Select ${product.name}`} /></TableCell>
                <TableCell className="whitespace-normal">
                  <div className="flex min-w-72 gap-3">
                    <ProductImage imagePath={product.imagePath} name={product.name} />
                    <div className="min-w-0">
                      <p className="font-medium">{product.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{product.id}</p>
                      <p className="mt-1 max-w-96 truncate text-xs text-muted-foreground">{product.shortDescription}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell>{formatValue(product.routineStep)}</TableCell>
                <TableCell>
                  <Badge variant={product.active ? "default" : "secondary"}>
                    {product.active ? "Active" : "Archived"}
                  </Badge>
                </TableCell>
                <TableCell>{product.priority}</TableCell>
                <TableCell>{product.recommendationCount}</TableCell>
                <TableCell>{new Date(product.updatedAt).toLocaleDateString()}</TableCell>
                <TableCell><ProductActions product={product} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-3 p-3 lg:hidden">
        {products.map((product) => (
          <article key={product.databaseId} className="rounded-lg border border-border bg-background p-4">
            <div className="flex items-start gap-3">
              <ProductImage imagePath={product.imagePath} name={product.name} />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{product.name}</p>
                <p className="truncate text-xs text-muted-foreground">{product.id}</p>
                <p className="mt-2 text-sm text-muted-foreground">{product.shortDescription}</p>
              </div>
              <Checkbox aria-label={`Select ${product.name}`} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="rounded-md border border-border bg-muted px-2 py-1">{product.category}</span>
              <span className="rounded-md border border-border bg-muted px-2 py-1">{formatValue(product.routineStep)}</span>
              <Badge variant={product.active ? "default" : "secondary"}>
                {product.active ? "Active" : "Archived"}
              </Badge>
            </div>
            <div className="mt-3">
              <ProductActions product={product} />
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

function ProductActions({ product }: { product: ProductRow }) {
  return (
    <details className="relative">
      <summary className="inline-flex h-10 w-fit shrink-0 cursor-pointer list-none items-center justify-center gap-1.5 rounded-none border border-border bg-transparent px-6 text-xs font-semibold tracking-widest text-foreground uppercase hover:bg-muted">
        Actions
      </summary>
      <div className="absolute right-0 z-20 mt-2 w-80 rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-lg">
        <ProductForm title="Edit Product" action={updateProductAction} submitLabel="Save changes" product={product} />
        <div className="mt-3 flex flex-wrap gap-2">
          <form action={product.active ? deactivateProductAction : activateProductAction}>
            <input type="hidden" name="id" value={product.databaseId} />
            <Button type="submit" variant="outline" size="sm">
              {product.active ? "Deactivate" : "Activate"}
            </Button>
          </form>
          <form action={deleteProductAction}>
            <input type="hidden" name="id" value={product.databaseId} />
            <Button type="submit" variant="outline" size="sm">
              <IconTrash className="size-4" />
              Delete/archive
            </Button>
          </form>
        </div>
      </div>
    </details>
  )
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  required,
  type = "text",
}: {
  label: string
  name: string
  defaultValue?: string
  placeholder?: string
  required?: boolean
  type?: string
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        className="rounded-md border border-input bg-background px-3 py-2 text-sm"
      />
    </label>
  )
}

function ProductImage({ imagePath, name }: { imagePath?: string; name: string }) {
  return (
    <div className="relative grid size-20 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-card text-xs text-muted-foreground">
      {imagePath ? (
        <Image src={imagePath} alt={`${name} product image`} fill sizes="80px" className="object-cover" />
      ) : (
        "No image"
      )}
    </div>
  )
}

function SummaryCard({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <Card>
      <CardContent>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-2 text-3xl font-semibold">{value}</p>
        <p className="mt-3 text-sm text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  )
}

function StatusPill({ tone, label }: { tone: SettingsModuleTone; label: string }) {
  return (
    <Badge
      className="shrink-0"
      variant={tone === "ready" ? "default" : tone === "attention" ? "outline" : "secondary"}
    >
      {label}
    </Badge>
  )
}

function countModules(modules: EnterpriseSettingsModule[], status: EnterpriseSettingsModule["status"]) {
  return modules.filter((module) => module.status === status).length
}

function countPreviewModules(modules: EnterpriseSettingsModule[]) {
  return modules.filter((module) => module.status.startsWith("Coming") || module.status === "Configuration preview").length
}

function formatValue(value: string) {
  return value
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase())
}
