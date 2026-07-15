// Live SVG guide drawn exactly over the camera preview (see CameraPanel in
// ScanFlow.tsx), replacing the old hand-placed CSS oval. Both shapes below
// are derived from the same numbers lib/scan/quality/checks.ts uses to
// score facePosition (FACE_HEIGHT_MIN/MAX, CENTER_TOLERANCE) and go
// through the same object-cover-aware mapping (lib/scan/quality/
// overlay-mapping.ts) as the raw landmark coordinates the check itself
// consumes. So: if the live outline and the target zone visually agree but
// the checklist still shows red, that's evidence of a scoring bug, not a
// coordinate one — and if the live outline clearly doesn't track where the
// user's face actually is on screen, that's evidence of a real coordinate
// mismatch. See the diagnosis notes for what real-device testing showed.
import { CENTER_TOLERANCE, FACE_HEIGHT_MAX, FACE_HEIGHT_MIN, type FaceBoundingBox } from "@/lib/scan/quality/checks"
import { computeObjectCoverMapping, mapNormalizedPoint, mapNormalizedSize } from "@/lib/scan/quality/overlay-mapping"
import type { QualityStatus } from "@/lib/scan/quality/types"
import type { VideoDimensions } from "@/lib/scan/quality/use-scan-quality"
import { cn } from "@/lib/utils"

// The container this overlay is drawn over is always `aspect-[4/3]` (see
// CameraPanel) — the SVG viewBox mirrors that ratio directly so shapes are
// expressed as plain fractions of it, independent of actual rendered pixel
// size.
const VIEWBOX_WIDTH = 4
const VIEWBOX_HEIGHT = 3

// Purely cosmetic proportion for the target oval's width — checks.ts only
// ever gates on height + center offset, so there's no "correct" width band
// to derive this from; a typical face width:height ratio just makes the
// guide read as a face shape rather than a circle.
const TARGET_OVAL_ASPECT = 0.75

export function FacePositionOverlay({
  faceBox,
  videoDimensions,
  status,
}: {
  faceBox: FaceBoundingBox | null
  videoDimensions: VideoDimensions | null
  status: QualityStatus
}) {
  if (!videoDimensions) return null

  const mapping = computeObjectCoverMapping(videoDimensions.width, videoDimensions.height, VIEWBOX_WIDTH, VIEWBOX_HEIGHT)

  const targetCenter = mapNormalizedPoint(0.5, 0.5, videoDimensions.width, videoDimensions.height, mapping)
  const idealHeight = (FACE_HEIGHT_MIN + FACE_HEIGHT_MAX) / 2
  const idealWidth = idealHeight * TARGET_OVAL_ASPECT
  const targetSize = mapNormalizedSize(idealWidth, idealHeight, videoDimensions.width, videoDimensions.height, mapping)

  const isAligned = status === "pass"

  const detected = faceBox
    ? {
        box: faceBox,
        center: mapNormalizedPoint(faceBox.centerX, faceBox.centerY, videoDimensions.width, videoDimensions.height, mapping),
        size: mapNormalizedSize(faceBox.width, faceBox.height, videoDimensions.width, videoDimensions.height, mapping),
      }
    : null

  return (
    <svg
      viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden
    >
      {/* Target zone — the acceptable centered/sized region, straight from
          checks.ts's own FACE_HEIGHT_MIN/MAX + CENTER_TOLERANCE constants. */}
      <ellipse
        cx={targetCenter.x * VIEWBOX_WIDTH}
        cy={targetCenter.y * VIEWBOX_HEIGHT}
        rx={(targetSize.width * VIEWBOX_WIDTH) / 2}
        ry={(targetSize.height * VIEWBOX_HEIGHT) / 2}
        strokeWidth={0.02}
        className={cn("fill-none transition-colors duration-300", isAligned ? "stroke-success" : "stroke-primary/50")}
      />
      {/* Live detected face — tracks the actual landmark bounding box every
          sample cycle, so any drift between "where the model thinks your
          face is" and "where your face actually is on screen" is visible
          directly, not just inferred from a pass/fail label. */}
      {detected ? (
        <ellipse
          cx={detected.center.x * VIEWBOX_WIDTH}
          cy={detected.center.y * VIEWBOX_HEIGHT}
          rx={(detected.size.width * VIEWBOX_WIDTH) / 2}
          ry={(detected.size.height * VIEWBOX_HEIGHT) / 2}
          strokeWidth={0.015}
          className={cn("fill-none transition-all duration-300 ease-out", isAligned ? "stroke-success" : "stroke-warning")}
        />
      ) : null}
      {process.env.NODE_ENV === "development" && detected ? (
        <text x={0.05} y={VIEWBOX_HEIGHT - 0.08} fontSize={0.11} className="fill-muted-foreground font-mono">
          {`cx ${detected.box.centerX.toFixed(2)} cy ${detected.box.centerY.toFixed(2)} h ${detected.box.height.toFixed(2)} (target h ${FACE_HEIGHT_MIN}-${FACE_HEIGHT_MAX}, tol ±${CENTER_TOLERANCE})`}
        </text>
      ) : null}
    </svg>
  )
}
