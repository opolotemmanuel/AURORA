"use client"

import { useCallback, useState } from "react"
import { IconRefresh, IconTrash } from "@tabler/icons-react"
import Cropper, { type Area } from "react-easy-crop"

import { Button } from "@/components/ui/button"
import { getCroppedImageBlob } from "@/lib/scan/crop-image"
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
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedArea, setCroppedArea] = useState<Area | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedArea(areaPixels)
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
    <div className="w-full max-w-md space-y-4 rounded-[2rem] border border-border bg-background p-3">
      <div className="px-1">
        <p className="font-heading text-sm font-semibold text-foreground">
          Adjust your photo
        </p>
        <p className="text-xs text-muted-foreground">
          Crop to focus on your face within the guide
        </p>
      </div>

      <div className="relative aspect-[3/4] overflow-hidden rounded-[1.5rem] bg-muted">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={3 / 4}
          cropShape="round"
          showGrid={false}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>

      <label className="flex items-center gap-3 px-1 text-xs text-muted-foreground">
        <span className="shrink-0">Zoom</span>
        <input
          type="range"
          min={1}
          max={3}
          step={0.05}
          value={zoom}
          onChange={(event) => setZoom(Number(event.target.value))}
          className="h-1.5 w-full accent-primary"
        />
      </label>

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
    </div>
  )
}
