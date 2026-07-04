"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"

import { ScanAnalyzingView } from "@/components/scan/scan-analyzing-view"
import { ScanCapturePanel } from "@/components/scan/scan-capture-panel"
import { ScanImageEditor } from "@/components/scan/scan-image-editor"
import { ScanQualityStep } from "@/components/scan/scan-quality-step"
import { ScanReportModal } from "@/components/scan/scan-report-modal"
import { ScanResultsView } from "@/components/scan/scan-results-view"
import { EASE_OUT } from "@/lib/ease"
import { saveScanResultAction } from "@/lib/scan/actions"
import { blobToBase64 } from "@/lib/scan/image-bytes"
import type {
  CaptureMode,
  ScanWizardStep,
  SkinAssessment,
} from "@/lib/scan/types"
import { cn } from "@/lib/utils"

export function ScanWizard() {
  const [step, setStep] = useState<ScanWizardStep>("capture")
  const [captureMode, setCaptureMode] = useState<CaptureMode>("upload")
  const [rawPreviewUrl, setRawPreviewUrl] = useState<string | null>(null)
  const [croppedPreviewUrl, setCroppedPreviewUrl] = useState<string | null>(
    null,
  )
  const [imageBlob, setImageBlob] = useState<Blob | null>(null)
  const [assessment, setAssessment] = useState<SkinAssessment | null>(null)
  const [scanId, setScanId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const urlsRef = useRef<string[]>([])

  const trackUrl = useCallback((url: string) => {
    urlsRef.current.push(url)
  }, [])

  const revokeAllUrls = useCallback(() => {
    for (const url of urlsRef.current) {
      URL.revokeObjectURL(url)
    }
    urlsRef.current = []
  }, [])

  useEffect(() => () => revokeAllUrls(), [revokeAllUrls])

  const resetScan = useCallback(() => {
    revokeAllUrls()
    setStep("capture")
    setCaptureMode("upload")
    setRawPreviewUrl(null)
    setCroppedPreviewUrl(null)
    setImageBlob(null)
    setAssessment(null)
    setScanId(null)
    setIsSaving(false)
    setReportOpen(false)
  }, [revokeAllUrls])

  const handleBackToEdit = useCallback(() => {
    if (croppedPreviewUrl) {
      URL.revokeObjectURL(croppedPreviewUrl)
      urlsRef.current = urlsRef.current.filter((url) => url !== croppedPreviewUrl)
    }
    setCroppedPreviewUrl(null)
    setImageBlob(null)
    setAssessment(null)
    setScanId(null)
    setIsSaving(false)
    setReportOpen(false)
    setStep("edit")
  }, [croppedPreviewUrl])

  const handleImageSelected = useCallback(
    (file: File, previewUrl: string, _source: CaptureMode) => {
      trackUrl(previewUrl)
      setRawPreviewUrl(previewUrl)
      setImageBlob(file)
      setStep("edit")
    },
    [trackUrl],
  )

  const handleCropConfirm = useCallback(
    (blob: Blob, previewUrl: string) => {
      trackUrl(previewUrl)
      setCroppedPreviewUrl(previewUrl)
      setImageBlob(blob)
      setStep("quality")
    },
    [trackUrl],
  )

  const handleQualityPass = useCallback(() => {
    setStep("analyzing")
  }, [])

  const persistAssessment = useCallback(
    async (result: SkinAssessment, photo: Blob | null) => {
      setIsSaving(true)
      try {
        const imageBase64 = photo ? await blobToBase64(photo) : undefined
        const saved = await saveScanResultAction({
          assessment: result,
          imageBase64,
          imageMimeType: photo?.type.startsWith("image/")
            ? (photo.type as "image/jpeg" | "image/png" | "image/webp")
            : "image/jpeg",
        })
        if (saved.ok) {
          setScanId(saved.scanId)
        }
      } catch {
        // Results remain visible even if save fails
      } finally {
        setIsSaving(false)
      }
    },
    [],
  )

  const handleAnalysisComplete = useCallback(
    (result: SkinAssessment) => {
      setAssessment(result)
      setStep("results")
      void persistAssessment(result, imageBlob)
    },
    [persistAssessment, imageBlob],
  )

  const isReportPhase = step === "results"

  return (
    <div className="relative flex min-h-svh flex-col">
      <div
        className={cn(
          "flex flex-1 flex-col items-center justify-center px-4 py-8",
          isReportPhase ? "py-10" : "py-12",
        )}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={isReportPhase ? "report-phase" : step}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: EASE_OUT }}
            className="flex w-full justify-center"
          >
            {step === "capture" ? (
              <ScanCapturePanel
                mode={captureMode}
                onModeChange={setCaptureMode}
                onImageSelected={handleImageSelected}
              />
            ) : null}

            {step === "edit" && rawPreviewUrl ? (
              <ScanImageEditor
                imageSrc={rawPreviewUrl}
                onConfirm={handleCropConfirm}
                onRetake={resetScan}
                onDelete={resetScan}
              />
            ) : null}

            {step === "quality" && croppedPreviewUrl ? (
              <ScanQualityStep
                imageSrc={croppedPreviewUrl}
                onPass={handleQualityPass}
                onReEdit={handleBackToEdit}
                onRetake={resetScan}
              />
            ) : null}

            {step === "analyzing" && imageBlob && croppedPreviewUrl ? (
              <ScanAnalyzingView
                imageSrc={croppedPreviewUrl}
                imageBlob={imageBlob}
                onComplete={handleAnalysisComplete}
              />
            ) : null}

            {step === "results" && assessment && croppedPreviewUrl ? (
              <ScanResultsView
                assessment={assessment}
                imageSrc={croppedPreviewUrl}
                onNewScan={resetScan}
                onReEdit={handleBackToEdit}
                onViewReport={() => setReportOpen(true)}
              />
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>

      {assessment ? (
        <ScanReportModal
          open={reportOpen}
          onOpenChange={setReportOpen}
          assessment={assessment}
          imageSrc={croppedPreviewUrl}
          scanId={scanId}
          isSaving={isSaving}
        />
      ) : null}
    </div>
  )
}
