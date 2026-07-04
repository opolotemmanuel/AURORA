"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { IconPlus } from "@tabler/icons-react"

import {
  ProductEditorForm,
  type ProductRecord,
} from "@/components/admin/product-editor"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ResponsiveDialog } from "@/components/ui/responsive-dialog"
import { cn } from "@/lib/utils"

function formatCatalogSubtitle(product: ProductRecord) {
  const concern = product.targetConcerns[0]?.replace(/_/g, " ")
  if (product.category && concern) {
    return `${product.category} · ${concern}`
  }
  return product.category || concern || "No matching tags yet"
}

type ProductsAdminClientProps = {
  products: ProductRecord[]
}

export function ProductsAdminClient({ products }: ProductsAdminClientProps) {
  const router = useRouter()
  const [editorOpen, setEditorOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = products.find((product) => product.id === selectedId) ?? null

  function openCreate() {
    setSelectedId(null)
    setEditorOpen(true)
  }

  function openEdit(id: string) {
    setSelectedId(id)
    setEditorOpen(true)
  }

  function handleClose(open: boolean) {
    setEditorOpen(open)
    if (!open) {
      setSelectedId(null)
    }
  }

  return (
    <>
      <div className="rounded-xl border border-border p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-sm font-medium">Catalog</h2>
          <Button type="button" size="sm" onClick={openCreate}>
            <IconPlus className="size-4" />
            Add product
          </Button>
        </div>

        <ul className="mt-4 max-h-[32rem] space-y-2 overflow-y-auto text-sm">
          {products.length === 0 ? (
            <li className="text-muted-foreground">No products yet.</li>
          ) : (
            products.map((product) => (
              <li key={product.id}>
                <button
                  type="button"
                  onClick={() => openEdit(product.id)}
                  className={cn(
                    "w-full rounded-xl border px-3 py-2 text-left transition-colors",
                    selectedId === product.id && editorOpen
                      ? "border-primary bg-muted/50"
                      : "border-border hover:bg-muted/30",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium">{product.name}</span>
                    {!product.isActive ? (
                      <Badge variant="secondary">Inactive</Badge>
                    ) : null}
                  </div>
                  <span className="text-muted-foreground capitalize">
                    {formatCatalogSubtitle(product)}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>

      <ResponsiveDialog
        open={editorOpen}
        onOpenChange={handleClose}
        title={selected ? "Edit product" : "Add product"}
        description={
          selected
            ? "Tune recommendation matching tags and product summary."
            : "Add a product for personalized scan recommendations."
        }
      >
        <ProductEditorForm
          key={selected?.id ?? "new"}
          product={selected}
          onSaved={() => {
            setEditorOpen(false)
            setSelectedId(null)
            router.refresh()
          }}
          onDeleted={() => {
            setEditorOpen(false)
            setSelectedId(null)
            router.refresh()
          }}
        />
      </ResponsiveDialog>
    </>
  )
}
