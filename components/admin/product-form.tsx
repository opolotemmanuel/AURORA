"use client"

import { useState, useTransition } from "react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createProductAction } from "@/lib/products/actions"

export function ProductForm() {
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const [form, setForm] = useState({
    sku: "",
    name: "",
    slug: "",
    description: "",
    category: "",
    ingredients: "",
    isActive: true,
  })

  return (
    <form
      className="max-w-lg space-y-4 rounded-lg border border-border p-4"
      onSubmit={(e) => {
        e.preventDefault()
        startTransition(async () => {
          try {
            await createProductAction({
              ...form,
              targetConcerns: [],
              suitableSkinTypes: [],
              climateTags: [],
            })
            setMessage("Product created.")
            setForm({
              sku: "",
              name: "",
              slug: "",
              description: "",
              category: "",
              ingredients: "",
              isActive: true,
            })
          } catch (err) {
            setMessage(err instanceof Error ? err.message : "Create failed")
          }
        })
      }}
    >
      <h2 className="font-heading text-lg font-medium">Add product</h2>
      {(["sku", "name", "slug", "category"] as const).map((field) => (
        <div key={field} className="space-y-2">
          <Label htmlFor={field} className="capitalize">
            {field}
          </Label>
          <Input
            id={field}
            value={form[field]}
            onChange={(e) => setForm({ ...form, [field]: e.target.value })}
            required
          />
        </div>
      ))}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="ingredients">Ingredients</Label>
        <Textarea
          id="ingredients"
          value={form.ingredients}
          onChange={(e) => setForm({ ...form, ingredients: e.target.value })}
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={form.isActive}
          onCheckedChange={(v) => setForm({ ...form, isActive: v === true })}
        />
        Active
      </label>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Create product"}
      </Button>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </form>
  )
}
