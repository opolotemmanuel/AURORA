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
import { requireAdminAccess } from "@/lib/auth/admin"
import { cn } from "@/lib/utils"

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
  const auth = requireAdminAccess("settings:manage")
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

      <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border pb-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold tracking-widest text-primary uppercase">
              <IconBuildingStore className="size-4" />
              Product Management
            </p>
            <h2 className="mt-2 text-xl font-semibold">Aurora Products</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Real PostgreSQL product records used by the recommendation engine. If no active products exist,
              recommendations will return an honest empty result instead of hard-coded live data.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
            {products.filter((product) => product.active).length} active / {products.length} total
          </div>
        </div>

        <div className="mt-6 grid gap-6">
          <ProductForm title="Add Product" action={createProductAction} submitLabel="Add product" />
          <ProductTable products={products} />
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        {modules.map((module) => {
          const Icon = moduleIcons[module.title] ?? IconSettings

          return (
            <article key={module.title} className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex gap-3">
                  <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted text-primary">
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">{module.title}</h2>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{module.description}</p>
                  </div>
                </div>
                <StatusPill tone={module.tone} label={module.status} />
              </div>

              <div className="mt-5 divide-y divide-border rounded-lg border border-border bg-muted">
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
            </article>
          )
        })}
      </section>

      <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted text-primary">
            <IconKey className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Secret Handling</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              This page only displays whether server-side configuration exists. It never displays
              `GEMINI_API_KEY`, `DATABASE_URL`, uploaded image data, or provider credentials.
            </p>
          </div>
        </div>
      </section>
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
          <input name="active" type="checkbox" defaultChecked={product?.active ?? true} className="size-4 accent-current" />
          Active in recommendation engine
        </label>
      </div>
      <button className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
        {submitLabel}
      </button>
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
        <table className="min-w-[1100px] w-full border-collapse text-left text-sm">
          <thead className="sticky top-0 z-10 bg-card text-xs text-muted-foreground">
            <tr className="border-b border-border">
              <th className="px-3 py-3"><input type="checkbox" aria-label="Select all products" /></th>
              <th className="px-3 py-3 font-medium">Product</th>
              <th className="px-3 py-3 font-medium">Category</th>
              <th className="px-3 py-3 font-medium">Routine</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-3 py-3 font-medium">Priority</th>
              <th className="px-3 py-3 font-medium">Recommendations</th>
              <th className="px-3 py-3 font-medium">Updated</th>
              <th className="px-3 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.databaseId} className="border-b border-border bg-background last:border-b-0 hover:bg-muted/60">
                <td className="px-3 py-3"><input type="checkbox" aria-label={`Select ${product.name}`} /></td>
                <td className="px-3 py-3">
                  <div className="flex min-w-72 gap-3">
                    <ProductImage imagePath={product.imagePath} name={product.name} />
                    <div className="min-w-0">
                      <p className="font-medium">{product.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{product.id}</p>
                      <p className="mt-1 max-w-96 truncate text-xs text-muted-foreground">{product.shortDescription}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3">{product.category}</td>
                <td className="px-3 py-3">{formatValue(product.routineStep)}</td>
                <td className="px-3 py-3">
                  <span className="rounded-md border border-border bg-card px-2 py-1 text-xs text-muted-foreground">
                    {product.active ? "Active" : "Archived"}
                  </span>
                </td>
                <td className="px-3 py-3">{product.priority}</td>
                <td className="px-3 py-3">{product.recommendationCount}</td>
                <td className="px-3 py-3">{new Date(product.updatedAt).toLocaleDateString()}</td>
                <td className="px-3 py-3"><ProductActions product={product} /></td>
              </tr>
            ))}
          </tbody>
        </table>
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
              <input type="checkbox" aria-label={`Select ${product.name}`} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="rounded-md border border-border bg-muted px-2 py-1">{product.category}</span>
              <span className="rounded-md border border-border bg-muted px-2 py-1">{formatValue(product.routineStep)}</span>
              <span className="rounded-md border border-border bg-muted px-2 py-1">{product.active ? "Active" : "Archived"}</span>
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
      <summary className="inline-flex cursor-pointer list-none items-center rounded-md border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
        Actions
      </summary>
      <div className="absolute right-0 z-20 mt-2 w-80 rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-lg">
        <ProductForm title="Edit Product" action={updateProductAction} submitLabel="Save changes" product={product} />
        <div className="mt-3 flex flex-wrap gap-2">
          <form action={product.active ? deactivateProductAction : activateProductAction}>
            <input type="hidden" name="id" value={product.databaseId} />
            <button className="rounded-md border border-border bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
              {product.active ? "Deactivate" : "Activate"}
            </button>
          </form>
          <form action={deleteProductAction}>
            <input type="hidden" name="id" value={product.databaseId} />
            <button className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
              <IconTrash className="size-4" />
              Delete/archive
            </button>
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
    <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
      <p className="mt-3 text-sm text-muted-foreground">{detail}</p>
    </div>
  )
}

function StatusPill({ tone, label }: { tone: SettingsModuleTone; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-md border px-2.5 py-1 text-xs font-medium",
        tone === "ready" && "border-border bg-primary text-primary-foreground",
        tone === "attention" && "border-border bg-background text-foreground",
        tone === "preview" && "border-border bg-muted text-muted-foreground",
      )}
    >
      {label}
    </span>
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
