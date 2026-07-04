"use client"

import { useState, useTransition } from "react"
import { IconChevronDown, IconTrash } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  PRODUCT_CLIMATE_TAGS,
  PRODUCT_CONCERN_OPTIONS,
  PRODUCT_SKIN_TYPE_OPTIONS,
} from "@/lib/products/constants"
import {
  createProductAction,
  deleteProductAction,
  updateProductAction,
} from "@/lib/products/actions"
import type { ProductFormInput } from "@/lib/products/schemas"
import { cn } from "@/lib/utils"

export type ProductRecord = {
  id: string
  sku: string
  name: string
  slug: string
  description: string
  category: string
  ingredients: string | null
  targetConcerns: string[]
  suitableSkinTypes: string[]
  climateTags: string[]
  imageUrl: string | null
  isActive: boolean
}

const EMPTY_FORM: ProductFormInput = {
  name: "",
  description: "",
  category: "",
  ingredients: "",
  targetConcerns: [],
  suitableSkinTypes: [],
  climateTags: [],
  imageUrl: "",
  isActive: true,
}

type ProductEditorProps = {
  product: ProductRecord | null
  onSaved: () => void
  onDeleted: () => void
}

function toggleItem(list: string[], item: string) {
  return list.includes(item) ? list.filter((i) => i !== item) : [...list, item]
}

function ChipSelect({
  label,
  options,
  selected,
  onChange,
}: {
  label: string
  options: readonly string[]
  selected: string[]
  onChange: (next: string[]) => void
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected.includes(option)
          return (
            <Button
              key={option}
              type="button"
              size="sm"
              variant={active ? "default" : "outline"}
              className="rounded-full capitalize"
              onClick={() => onChange(toggleItem(selected, option))}
            >
              {option.replace(/_/g, " ")}
            </Button>
          )
        })}
      </div>
    </div>
  )
}

function mapProductToForm(product: ProductRecord): ProductFormInput {
  return {
    name: product.name,
    description: product.description,
    category: product.category,
    ingredients: product.ingredients ?? "",
    targetConcerns: product.targetConcerns,
    suitableSkinTypes: product.suitableSkinTypes,
    climateTags: product.climateTags,
    imageUrl: product.imageUrl ?? "",
    isActive: product.isActive,
  }
}

export function ProductEditorForm({
  product,
  onSaved,
  onDeleted,
}: ProductEditorProps) {
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const [showOptional, setShowOptional] = useState(false)
  const [form, setForm] = useState<ProductFormInput>(
    product ? mapProductToForm(product) : EMPTY_FORM,
  )
  const isEditing = Boolean(product)

  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={(event) => {
        event.preventDefault()
        startTransition(async () => {
          try {
            if (isEditing && product) {
              await updateProductAction(product.id, form)
              setMessage("Product updated.")
            } else {
              await createProductAction(form)
              setMessage("Product created.")
              setForm(EMPTY_FORM)
            }
            onSaved()
          } catch (error) {
            setMessage(
              error instanceof Error ? error.message : "Save failed",
            )
          }
        })
      }}
    >
      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-4">
        {isEditing && product ? (
          <p className="text-muted-foreground font-mono text-xs">
            {product.sku} · {product.slug}
          </p>
        ) : null}

        <section className="space-y-4">
          <div>
            <h3 className="font-heading text-sm font-medium">
              Recommendation profile
            </h3>
            <p className="text-muted-foreground mt-1 text-xs">
              Used to match this product to scan results and skin goals.
            </p>
          </div>

          <ChipSelect
            label="Target concerns"
            options={PRODUCT_CONCERN_OPTIONS}
            selected={form.targetConcerns}
            onChange={(targetConcerns) => setForm({ ...form, targetConcerns })}
          />

          <ChipSelect
            label="Suitable skin types"
            options={PRODUCT_SKIN_TYPE_OPTIONS}
            selected={form.suitableSkinTypes}
            onChange={(suitableSkinTypes) =>
              setForm({ ...form, suitableSkinTypes })
            }
          />

          <ChipSelect
            label="Climate tags"
            options={PRODUCT_CLIMATE_TAGS}
            selected={form.climateTags}
            onChange={(climateTags) => setForm({ ...form, climateTags })}
          />

          <div className="space-y-2">
            <Label htmlFor="ingredients">Key ingredients</Label>
            <Textarea
              id="ingredients"
              value={form.ingredients ?? ""}
              onChange={(event) =>
                setForm({ ...form, ingredients: event.target.value })
              }
              rows={3}
              placeholder="Optional — helps explain why it fits certain concerns"
            />
          </div>
        </section>

        <section className="space-y-4 border-t border-border pt-4">
          <h3 className="font-heading text-sm font-medium">Basics</h3>

          <div className="space-y-2">
            <Label htmlFor="name">Product name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">How it helps</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
              required
              rows={3}
              placeholder="Short cosmetic summary for recommendations"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Product type</Label>
            <Input
              id="category"
              value={form.category}
              onChange={(event) =>
                setForm({ ...form, category: event.target.value })
              }
              required
              placeholder="e.g. serum, cleanser, moisturizer"
            />
          </div>
        </section>

        <section className="border-t border-border pt-2">
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground flex w-full items-center justify-between py-2 text-sm"
            onClick={() => setShowOptional((open) => !open)}
          >
            Optional display settings
            <IconChevronDown
              className={cn(
                "size-4 transition-transform",
                showOptional && "rotate-180",
              )}
            />
          </button>

          {showOptional ? (
            <div className="space-y-4 pb-2">
              <div className="space-y-2">
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input
                  id="imageUrl"
                  type="url"
                  value={form.imageUrl ?? ""}
                  onChange={(event) =>
                    setForm({ ...form, imageUrl: event.target.value })
                  }
                  placeholder="https://"
                />
              </div>

              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.isActive}
                  onCheckedChange={(value) =>
                    setForm({ ...form, isActive: value === true })
                  }
                />
                Include in recommendations
              </label>
            </div>
          ) : null}
        </section>

        {message ? (
          <p
            className={cn(
              "text-sm",
              message.includes("failed") || message.includes("Delete")
                ? "text-destructive"
                : "text-muted-foreground",
            )}
          >
            {message}
          </p>
        ) : null}
      </div>

      <div className="bg-background shrink-0 border-t border-border px-6 py-4">
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : isEditing ? "Save changes" : "Create product"}
          </Button>
          {isEditing && product ? (
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  if (!product) return
                  if (!window.confirm(`Delete ${product.name}?`)) return
                  try {
                    await deleteProductAction(product.id)
                    setMessage("Product deleted.")
                    onDeleted()
                  } catch (error) {
                    setMessage(
                      error instanceof Error ? error.message : "Delete failed",
                    )
                  }
                })
              }
            >
              <IconTrash className="size-3.5" />
              Delete
            </Button>
          ) : null}
        </div>
      </div>
    </form>
  )
}

export function ProductEditor(props: ProductEditorProps) {
  return <ProductEditorForm key={props.product?.id ?? "new"} {...props} />
}
