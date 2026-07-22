"use client"

// Lets a user declare their own allergies (e.g. "fragrance, lanolin") so
// lib/products/filter-recommendations-by-allergies.ts can exclude any
// catalog product whose keyIngredients conflicts with them — a safety
// exclusion applied in lib/backend/scan-service.ts before product scoring,
// not just a scoring penalty. Comma/semicolon-separated free text, same
// format lib/products/match-allergies.ts's parseAllergyTokens expects.
import { useState } from "react"
import { IconAlertCircle, IconCircleCheck, IconLoader2 } from "@tabler/icons-react"

import { updateAllergies } from "@/app/(dashboard)/account/allergies-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function AllergiesForm({ initialAllergies }: { initialAllergies: string | null }) {
  const [value, setValue] = useState(initialAllergies ?? "")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccess(false)
    setIsSubmitting(true)

    const result = await updateAllergies(value)
    setIsSubmitting(false)

    if (!result.success) {
      setError(result.error)
      return
    }

    setSuccess(true)
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="allergies">Known allergies</Label>
        <Input
          id="allergies"
          placeholder="e.g. fragrance, lanolin, coconut"
          value={value}
          onChange={(event) => {
            setValue(event.target.value)
            setError(null)
            setSuccess(false)
          }}
        />
        <p className="text-xs text-muted-foreground">
          Comma or semicolon separated. Products containing a declared allergen are excluded from your
          recommendations entirely — never just ranked lower.
        </p>
      </div>

      {error ? (
        <p
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <IconAlertCircle className="size-4 shrink-0" />
          {error}
        </p>
      ) : null}

      {success ? (
        <p
          role="status"
          className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm text-primary"
        >
          <IconCircleCheck className="size-4 shrink-0" />
          Allergies saved.
        </p>
      ) : null}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? <IconLoader2 className="size-4 animate-spin" /> : null}
        Save allergies
      </Button>
    </form>
  )
}
