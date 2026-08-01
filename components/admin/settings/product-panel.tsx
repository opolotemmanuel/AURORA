"use client"

// Product Management tab — moved out of app/(dashboard)/settings/page.tsx
// as part of the tabbed console restructure. Same real PostgreSQL product
// records and same server actions as before (create/update/activate/
// deactivate/delete-or-archive). Console-style redesign: shared toolbar,
// removable status filter chip, sortable column headers, and client-side
// pagination — all operating on the full product array already returned by
// listProducts() (no new query, no new query params).
import Image from "next/image"
import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import type {
  activateProductAction,
  createProductAction,
  deactivateProductAction,
  deleteProductAction,
  updateProductAction,
} from "@/app/(dashboard)/settings/product-actions"
import type { listProducts } from "@/lib/backend/product-service"
import { downloadCsv } from "@/lib/csv-export"
import { cn } from "@/lib/utils"
import { SingleSelectFilterChips } from "@/components/admin/filter-chip-bar"
import { PaginationFooter } from "@/components/admin/pagination-footer"
import { SortableHeader } from "@/components/admin/sortable-header"
import { ConsoleToolbar } from "@/components/admin/settings/console-toolbar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { IconBuildingStore, IconPlus, IconTrash } from "@tabler/icons-react"

type ProductRow = Awaited<ReturnType<typeof listProducts>>[number]

type ProductActionHandlers = {
  create: typeof createProductAction
  update: typeof updateProductAction
  activate: typeof activateProductAction
  deactivate: typeof deactivateProductAction
  remove: typeof deleteProductAction
}

const PAGE_SIZE = 20

type StatusFilter = "active" | "needs-curation" | "inactive"

const STATUS_FILTER_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: "active", label: "Active only" },
  { value: "needs-curation", label: "Needs curation" },
  { value: "inactive", label: "Inactive" },
]

// A product "needs curation" when it's active in the recommendation engine
// but missing catalog fields a shopper-facing product listing should have.
// Every field checked here is already returned by listProducts() — this is
// a client-derived label, not a stored Product flag.
function needsCuration(product: ProductRow) {
  return product.active && (!product.imagePath || !product.officialUrl || !product.keyIngredients?.length)
}

type SortKey = "name" | "category" | "priority" | "recommendationCount" | "createdAt" | "updatedAt"
type SortState = { key: SortKey; direction: "asc" | "desc" } | null

export function ProductPanel({ products, actions }: { products: ProductRow[]; actions: ProductActionHandlers }) {
  const router = useRouter()
  const [showAddForm, setShowAddForm] = useState(false)
  const [statusFilter, setStatusFilter] = useState<StatusFilter | "all">("all")
  const [sort, setSort] = useState<SortState>(null)
  const [page, setPage] = useState(1)

  const activeCount = products.filter((product) => product.active).length

  const filtered = useMemo(() => {
    if (statusFilter === "active") return products.filter((product) => product.active)
    if (statusFilter === "inactive") return products.filter((product) => !product.active)
    if (statusFilter === "needs-curation") return products.filter(needsCuration)
    return products
  }, [products, statusFilter])

  const sorted = useMemo(() => {
    if (!sort) return filtered
    const { key, direction } = sort
    const factor = direction === "asc" ? 1 : -1

    return [...filtered].sort((a, b) => {
      const aValue = a[key]
      const bValue = b[key]
      if (typeof aValue === "number" && typeof bValue === "number") return (aValue - bValue) * factor
      return String(aValue).localeCompare(String(bValue)) * factor
    })
  }, [filtered, sort])

  const pageCount = Math.max(Math.ceil(sorted.length / PAGE_SIZE), 1)
  const currentPage = Math.min(page, pageCount)
  const pageStart = (currentPage - 1) * PAGE_SIZE
  const pageItems = sorted.slice(pageStart, pageStart + PAGE_SIZE)

  function toggleSort(key: SortKey) {
    setPage(1)
    setSort((current) => {
      if (!current || current.key !== key) return { key, direction: "asc" }
      if (current.direction === "asc") return { key, direction: "desc" }
      return null
    })
  }

  function handleExport() {
    downloadCsv(
      `products-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Name", "Category", "Routine", "Status", "Priority", "Recommendations", "Created", "Updated"],
      sorted.map((product) => [
        product.name,
        product.category,
        product.routineStep,
        product.active ? "Active" : "Archived",
        String(product.priority),
        String(product.recommendationCount),
        product.createdAt,
        product.updatedAt,
      ]),
    )
  }

  return (
    <div className="space-y-5">
      <ConsoleToolbar
        icon={IconBuildingStore}
        eyebrow="Product Management"
        breadcrumb={[{ label: "Settings", href: "/settings" }, { label: "Products" }]}
        title="Aurora Products"
        description="Real PostgreSQL product records used by the recommendation engine. If no active products exist, recommendations will return an honest empty result instead of hard-coded live data."
        primaryAction={{
          label: showAddForm ? "Close form" : "Add product",
          icon: IconPlus,
          onClick: () => setShowAddForm((value) => !value),
        }}
        onRefresh={() => router.refresh()}
        onExport={handleExport}
        exportDisabled={sorted.length === 0}
      >
        <SingleSelectFilterChips
          value={statusFilter}
          options={STATUS_FILTER_OPTIONS}
          onChange={(value) => {
            setPage(1)
            setStatusFilter(value as StatusFilter | "all")
          }}
        />
      </ConsoleToolbar>

      {showAddForm ? (
        <Card>
          <CardContent>
            <ProductForm title="Add Product" action={actions.create} submitLabel="Add product" />
          </CardContent>
        </Card>
      ) : null}

      <Card size="sm">
        <CardContent className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{activeCount}</span>
          <span>Active</span>
          <span>·</span>
          <span className="font-medium text-foreground">{products.length}</span>
          <span>Total Products</span>
        </CardContent>
      </Card>

      <ProductTable
        products={pageItems}
        actions={actions}
        sort={sort}
        onSort={toggleSort}
        hasAnyProducts={products.length > 0}
      />

      {products.length > 0 ? (
        <PaginationFooter
          start={sorted.length === 0 ? 0 : pageStart + 1}
          end={Math.min(pageStart + PAGE_SIZE, sorted.length)}
          total={sorted.length}
          itemLabel="products"
          page={currentPage}
          pageCount={pageCount}
          prev={currentPage > 1 ? { onClick: () => setPage(currentPage - 1) } : null}
          next={currentPage < pageCount ? { onClick: () => setPage(currentPage + 1) } : null}
        />
      ) : null}
    </div>
  )
}

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
      <div className="space-y-6">
        <div>
          <h4 className="mb-3 font-heading text-sm font-semibold">Basic Info</h4>
          <div className="grid gap-x-6 gap-y-4 md:grid-cols-2">
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
          </div>
        </div>

        <div className="border-t border-border pt-6">
          <h4 className="mb-3 font-heading text-sm font-semibold">Description & Media</h4>
          <div className="grid gap-x-6 gap-y-4 md:grid-cols-2">
            <label className="grid gap-1 text-sm md:col-span-2">
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
              className="md:col-span-2"
            />
            <Field
              label="Official Aurora product URL"
              name="officialUrl"
              defaultValue={product?.officialUrl}
              placeholder="https://aurora.example.com/products/glow-serum"
              className="md:col-span-2"
            />
          </div>
        </div>

        <div className="border-t border-border pt-6">
          <h4 className="mb-3 font-heading text-sm font-semibold">Recommendation Data</h4>
          <div className="grid gap-x-6 gap-y-4 md:grid-cols-2">
            <Field
              label="Cosmetic benefits"
              name="cosmeticBenefits"
              defaultValue={product?.cosmeticBenefits.join(", ")}
              placeholder="Hydration appearance, Radiance support"
              required
              className="md:col-span-2"
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
            <Field
              label="Key ingredients"
              name="keyIngredients"
              defaultValue={product?.keyIngredients?.join(", ")}
              placeholder="Niacinamide, Hyaluronic acid"
              className="md:col-span-2"
            />
            <Field label="Priority" name="priority" type="number" defaultValue={String(product?.priority ?? 50)} required />
            <label className="flex items-center gap-2 text-sm">
              <Checkbox name="active" defaultChecked={product?.active ?? true} />
              Active in recommendation engine
            </label>
          </div>
        </div>
      </div>
      <Button type="submit" className="mt-4">
        {submitLabel}
      </Button>
    </form>
  )
}

function ProductTable({
  products,
  actions,
  sort,
  onSort,
  hasAnyProducts,
}: {
  products: ProductRow[]
  actions: ProductActionHandlers
  sort: SortState
  onSort: (key: SortKey) => void
  hasAnyProducts: boolean
}) {
  if (!hasAnyProducts) {
    return (
      <Card>
        <CardContent className="text-sm text-muted-foreground">
          No Aurora products exist in PostgreSQL yet. Add the first product to enable live recommendations.
        </CardContent>
      </Card>
    )
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="text-sm text-muted-foreground">No products match this filter.</CardContent>
      </Card>
    )
  }

  function headerProps(key: SortKey) {
    return {
      active: sort?.key === key,
      direction: sort?.key === key ? sort.direction : undefined,
      onSort: () => onSort(key),
    }
  }

  return (
    <Card className="overflow-hidden py-0">
      <div className="hidden overflow-x-auto lg:block">
        <Table className="min-w-[1250px]">
          <TableHeader className="sticky top-0 z-10 bg-muted">
            <TableRow>
              <SortableHeader label="Product" {...headerProps("name")} />
              <SortableHeader label="Category" {...headerProps("category")} />
              <TableHead>Routine</TableHead>
              <TableHead>Key ingredients</TableHead>
              <TableHead>Cosmetic benefits</TableHead>
              <TableHead>Status</TableHead>
              <SortableHeader label="Priority" {...headerProps("priority")} />
              <SortableHeader label="Recommendations" {...headerProps("recommendationCount")} />
              <SortableHeader label="Created" {...headerProps("createdAt")} />
              <SortableHeader label="Updated" {...headerProps("updatedAt")} />
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.databaseId}>
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
                <TableCell><TagList values={product.keyIngredients} /></TableCell>
                <TableCell><TagList values={product.cosmeticBenefits} /></TableCell>
                <TableCell>
                  <Badge variant={product.active ? "default" : "secondary"}>
                    {product.active ? "Active" : "Archived"}
                  </Badge>
                </TableCell>
                <TableCell>{product.priority}</TableCell>
                <TableCell>{product.recommendationCount}</TableCell>
                <TableCell>{new Date(product.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(product.updatedAt).toLocaleDateString()}</TableCell>
                <TableCell><ProductActions product={product} actions={actions} /></TableCell>
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
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="rounded-md border border-border bg-muted px-2 py-1">{product.category}</span>
              <span className="rounded-md border border-border bg-muted px-2 py-1">{formatValue(product.routineStep)}</span>
              <Badge variant={product.active ? "default" : "secondary"}>
                {product.active ? "Active" : "Archived"}
              </Badge>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <TagList values={product.keyIngredients} />
            </div>
            <div className="mt-3">
              <ProductActions product={product} actions={actions} />
            </div>
          </article>
        ))}
      </div>
    </Card>
  )
}

function ProductActions({ product, actions }: { product: ProductRow; actions: ProductActionHandlers }) {
  return (
    <details className="relative">
      <summary className="inline-flex h-10 w-fit shrink-0 cursor-pointer list-none items-center justify-center gap-1.5 rounded-none border border-border bg-transparent px-6 text-xs font-semibold tracking-widest text-foreground uppercase hover:bg-muted">
        Actions
      </summary>
      <div className="absolute right-0 z-20 mt-2 w-80 rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-lg">
        <ProductForm title="Edit Product" action={actions.update} submitLabel="Save changes" product={product} />
        <div className="mt-3 flex flex-wrap gap-2">
          <form action={product.active ? actions.deactivate : actions.activate}>
            <input type="hidden" name="id" value={product.databaseId} />
            <Button type="submit" variant="outline" size="sm">
              {product.active ? "Deactivate" : "Activate"}
            </Button>
          </form>
          <form action={actions.remove}>
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
  className,
}: {
  label: string
  name: string
  defaultValue?: string
  placeholder?: string
  required?: boolean
  type?: string
  className?: string
}) {
  return (
    <label className={cn("grid gap-1 text-sm", className)}>
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

// Shows the first 2 tags as chips; anything beyond that collapses into a
// "+N" chip whose tooltip reveals the full list, rather than letting a
// long ingredient/benefit list wrap the row awkwardly.
const VISIBLE_TAG_COUNT = 2

function TagList({ values }: { values?: string[] }) {
  if (!values || values.length === 0) {
    return <span className="text-xs text-muted-foreground">None recorded</span>
  }

  const visible = values.slice(0, VISIBLE_TAG_COUNT)
  const overflow = values.slice(VISIBLE_TAG_COUNT)

  return (
    <div className="flex max-w-56 flex-wrap gap-1">
      {visible.map((value) => (
        <span key={value} className="rounded-md border border-border bg-background px-2 py-0.5 text-xs text-muted-foreground">
          {value}
        </span>
      ))}
      {overflow.length > 0 ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-default rounded-md border border-border bg-background px-2 py-0.5 text-xs font-medium text-foreground">
              +{overflow.length}
            </span>
          </TooltipTrigger>
          <TooltipContent>{overflow.join(", ")}</TooltipContent>
        </Tooltip>
      ) : null}
    </div>
  )
}

function formatValue(value: string) {
  return value
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase())
}
