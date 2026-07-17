// Product Management tab — moved out of app/(dashboard)/settings/page.tsx
// as part of the tabbed console restructure. Same real PostgreSQL product
// records and same server actions as before (create/update/activate/
// deactivate/delete-or-archive); the table now also surfaces key
// ingredients, cosmetic benefits, and created date — all real Product
// fields that existed already but weren't shown in the table. Deliberately
// no brand/skin type/price columns: those fields don't exist on the
// Product model. Card layout (header card / summary card / table card)
// mirrors the established pattern in components/report/reports-table.tsx.
import Image from "next/image"

import type {
  activateProductAction,
  createProductAction,
  deactivateProductAction,
  deleteProductAction,
  updateProductAction,
} from "@/app/(dashboard)/settings/product-actions"
import type { listProducts } from "@/lib/backend/product-service"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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

export function ProductPanel({ products, actions }: { products: ProductRow[]; actions: ProductActionHandlers }) {
  const activeCount = products.filter((product) => product.active).length

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <p className="flex items-center gap-2 text-xs font-semibold tracking-widest text-primary uppercase">
            <IconBuildingStore className="size-4" />
            Product Management
          </p>
          <CardTitle className="mt-2">Aurora Products</CardTitle>
          <CardDescription className="mt-2 max-w-3xl leading-6">
            Real PostgreSQL product records used by the recommendation engine. If no active products exist,
            recommendations will return an honest empty result instead of hard-coded live data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProductForm title="Add Product" action={actions.create} submitLabel="Add product" />
        </CardContent>
      </Card>

      <Card size="sm">
        <CardContent className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{activeCount}</span>
          <span>Active</span>
          <span>·</span>
          <span className="font-medium text-foreground">{products.length}</span>
          <span>Total Products</span>
        </CardContent>
      </Card>

      <ProductTable products={products} actions={actions} />
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

function ProductTable({ products, actions }: { products: ProductRow[]; actions: ProductActionHandlers }) {
  if (!products.length) {
    return (
      <Card>
        <CardContent className="text-sm text-muted-foreground">
          No Aurora products exist in PostgreSQL yet. Add the first product to enable live recommendations.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden py-0">
      <div className="hidden overflow-x-auto lg:block">
        <Table className="min-w-[1300px]">
          <TableHeader className="sticky top-0 z-10 bg-muted">
            <TableRow>
              <TableHead><Checkbox aria-label="Select all products" /></TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Routine</TableHead>
              <TableHead>Key ingredients</TableHead>
              <TableHead>Cosmetic benefits</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Recommendations</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.databaseId}>
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
              <Checkbox aria-label={`Select ${product.name}`} />
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
