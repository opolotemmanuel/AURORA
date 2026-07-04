"use client"

import {
  createFileUploadItem,
  FileUpload,
  type FileUploadItem,
} from "@/components/motion/file-upload"

type ScanUploadPanelProps = {
  onImageSelected: (file: File, previewUrl: string) => void
}

export function ScanUploadPanel({ onImageSelected }: ScanUploadPanelProps) {
  const handleFilesAdded = (added: FileUploadItem[], files: File[]) => {
    const file = files[0]
    const item = added[0]
    if (!file || !item) return

    const previewUrl = URL.createObjectURL(file)
    onImageSelected(file, previewUrl)
  }

  return (
    <FileUpload
      accept="image/*"
      multiple={false}
      maxFiles={1}
      variant="centered"
      title="Drop your photo here"
      description="JPG or PNG, well-lit, face clearly visible"
      browseLabel="Browse photos"
      onFilesAdded={handleFilesAdded}
      defaultValue={[]}
    />
  )
}

export function createScanUploadItem(file: File): FileUploadItem {
  return {
    ...createFileUploadItem(file),
    progress: 100,
    status: "success",
  }
}
