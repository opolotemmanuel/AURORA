"use client"

import { useCallback, useState } from "react"
import { IconRefresh, IconTrash } from "@tabler/icons-react"

import { RectCropCanvas } from "@/components/scan/rect-crop-canvas"
import { ScanStepShell } from "@/components/scan/scan-step-shell"
import { Button } from "@/components/ui/button"
import { getCroppedImageBlob, type PixelCrop } from "@/lib/scan/crop-image"
import { cn } from "@/lib/utils"

type ScanImageEditorProps = {
  imageSrc: string
  onConfirm: (blob: Blob, previewUrl: string) => void
  onRetake: () => void
  onDelete: () => void
}

export function ScanImageEditor({
  imageSrc,
  onConfirm,
  onRetake,
  onDelete,
}: ScanImageEditorProps) {
  const [croppedArea, setCroppedArea] = useState<PixelCrop | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const onCropChange = useCallback((crop: PixelCrop) => {
    setCroppedArea(crop)
  }, [])

  const handleConfirm = async () => {
    if (!croppedArea) return
    setSubmitting(true)
    try {
      const blob = await getCroppedImageBlob(imageSrc, croppedArea)
      const previewUrl = URL.createObjectURL(blob)
      onConfirm(blob, previewUrl)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ScanStepShell
      title="Adjust your photo"
      description="Drag the box to move it. Pull the corners to resize. Only the highlighted rectangle is saved."
    >
      <RectCropCanvas imageSrc={imageSrc} onCropChange={onCropChange} />

      <p className="text-center text-xs text-muted-foreground">
        The dimmed area is not included in your scan.
      </p>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRetake}
          className={cn("rounded-full")}
        >
          <IconRefresh className="size-3.5" />
          Retake
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onDelete}
          className="rounded-full"
        >
          <IconTrash className="size-3.5" />
          Delete
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={submitting || !croppedArea}
          onClick={() => void handleConfirm()}
          className="ml-auto rounded-full"
        >
          {submitting ? "Preparing…" : "Continue"}
        </Button>
      </div>
    </ScanStepShell>
  )
}
