"use client"

import { useState, useTransition } from "react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  createModelRateAction,
  setActiveScanModelAction,
  updateModelRateAction,
} from "@/lib/models/actions"
import type { ModelRateFormInput } from "@/lib/models/schemas"
import { cn } from "@/lib/utils"

export type ModelRateRecord = {
  id: string
  provider: ModelRateFormInput["provider"]
  modelId: string
  displayName: string | null
  inputMicrosPer1M: number
  outputMicrosPer1M: number
  cachedInputMicrosPer1M: number
  isActive: boolean
  isScanDefault: boolean
  supportsVision: boolean
}

const EMPTY_FORM: ModelRateFormInput = {
  provider: "gemini",
  modelId: "",
  displayName: "",
  inputMicrosPer1M: 150_000,
  outputMicrosPer1M: 600_000,
  cachedInputMicrosPer1M: 37_500,
  isActive: true,
  supportsVision: true,
}

function mapRecordToForm(record: ModelRateRecord): ModelRateFormInput {
  return {
    provider: record.provider,
    modelId: record.modelId,
    displayName: record.displayName ?? "",
    inputMicrosPer1M: record.inputMicrosPer1M,
    outputMicrosPer1M: record.outputMicrosPer1M,
    cachedInputMicrosPer1M: record.cachedInputMicrosPer1M,
    isActive: record.isActive,
    supportsVision: record.supportsVision,
  }
}

function formatUsdPer1M(micros: number): string {
  return `$${(micros / 1_000_000).toFixed(4)}`
}

export function ModelRateEditor({
  models,
}: {
  models: ModelRateRecord[]
}) {
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ModelRateFormInput>(EMPTY_FORM)

  function resetForm() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setMessage(null)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border">
        <div className="border-b border-border px-4 py-3">
          <h2 className="font-heading text-sm font-medium">Configured models</h2>
        </div>
        <ul className="divide-y divide-border">
          {models.length === 0 ? (
            <li className="px-4 py-6 text-sm text-muted-foreground">
              No models configured yet.
            </li>
          ) : (
            models.map((model) => (
              <li
                key={model.id}
                className="flex flex-wrap items-center justify-between gap-4 px-4 py-4"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">
                      {model.displayName ?? model.modelId}
                    </p>
                    {model.isScanDefault ? (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                        Active for scans
                      </span>
                    ) : null}
                    {!model.isActive ? (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        Inactive
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {model.provider} · {model.modelId}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    In {formatUsdPer1M(model.inputMicrosPer1M)} · Out{" "}
                    {formatUsdPer1M(model.outputMicrosPer1M)} · Cached{" "}
                    {formatUsdPer1M(model.cachedInputMicrosPer1M)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingId(model.id)
                      setForm(mapRecordToForm(model))
                      setMessage(null)
                    }}
                  >
                    Edit
                  </Button>
                  {!model.isScanDefault ? (
                    <Button
                      type="button"
                      size="sm"
                      disabled={pending || !model.isActive || !model.supportsVision}
                      onClick={() => {
                        startTransition(async () => {
                          try {
                            await setActiveScanModelAction(model.id)
                            setMessage("Active scan model updated.")
                          } catch (err) {
                            setMessage(
                              err instanceof Error ? err.message : "Update failed",
                            )
                          }
                        })
                      }}
                    >
                      Set active
                    </Button>
                  ) : null}
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      <form
        className="space-y-4 rounded-xl border border-border p-4"
        onSubmit={(e) => {
          e.preventDefault()
          startTransition(async () => {
            try {
              if (editingId) {
                await updateModelRateAction(editingId, form)
                setMessage("Model updated.")
              } else {
                await createModelRateAction(form)
                setMessage("Model added.")
              }
              resetForm()
            } catch (err) {
              setMessage(err instanceof Error ? err.message : "Save failed")
            }
          })
        }}
      >
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-heading text-lg font-medium">
            {editingId ? "Edit model" : "Add model"}
          </h2>
          {editingId ? (
            <Button type="button" variant="ghost" size="sm" onClick={resetForm}>
              Cancel edit
            </Button>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="provider">Provider</Label>
            <Select
              value={form.provider}
              onValueChange={(value) =>
                setForm((current) => ({
                  ...current,
                  provider: value as ModelRateFormInput["provider"],
                }))
              }
            >
              <SelectTrigger id="provider">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gemini">gemini</SelectItem>
                <SelectItem value="vercel_ai">vercel_ai</SelectItem>
                <SelectItem value="openrouter">openrouter</SelectItem>
                <SelectItem value="other">other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="modelId">Model ID</Label>
            <Input
              id="modelId"
              value={form.modelId}
              onChange={(e) =>
                setForm((current) => ({ ...current, modelId: e.target.value }))
              }
              placeholder="gemini-2.5-flash"
              required
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="displayName">Display name</Label>
            <Input
              id="displayName"
              value={form.displayName}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  displayName: e.target.value,
                }))
              }
              placeholder="Gemini 2.5 Flash"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="inputMicros">Input micro-USD / 1M tokens</Label>
            <Input
              id="inputMicros"
              type="number"
              min={1}
              value={form.inputMicrosPer1M}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  inputMicrosPer1M: Number.parseInt(e.target.value, 10) || 0,
                }))
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="outputMicros">Output micro-USD / 1M tokens</Label>
            <Input
              id="outputMicros"
              type="number"
              min={1}
              value={form.outputMicrosPer1M}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  outputMicrosPer1M: Number.parseInt(e.target.value, 10) || 0,
                }))
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cachedMicros">Cached input micro-USD / 1M</Label>
            <Input
              id="cachedMicros"
              type="number"
              min={0}
              value={form.cachedInputMicrosPer1M}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  cachedInputMicrosPer1M:
                    Number.parseInt(e.target.value, 10) || 0,
                }))
              }
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={form.isActive}
              onCheckedChange={(checked) =>
                setForm((current) => ({
                  ...current,
                  isActive: checked === true,
                }))
              }
            />
            Active
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={form.supportsVision}
              onCheckedChange={(checked) =>
                setForm((current) => ({
                  ...current,
                  supportsVision: checked === true,
                }))
              }
            />
            Supports vision
          </label>
        </div>

        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : editingId ? "Update model" : "Add model"}
        </Button>
        {message ? (
          <p className={cn("text-sm", "text-muted-foreground")}>{message}</p>
        ) : null}
      </form>
    </div>
  )
}
