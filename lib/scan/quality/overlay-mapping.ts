// Maps points/sizes normalized against the RAW camera frame (0-1, the same
// space MediaPipe's landmarks and evaluateFacePosition in checks.ts use)
// into 0-1 fractions of the DISPLAYED video box, given the live `<video>`
// element is rendered with CSS `object-cover` inside a fixed-aspect
// container (see CameraPanel in components/scan/ScanFlow.tsx).
//
// `object-cover` scales the raw frame up until it fully covers the
// container, then crops the overflow symmetrically — this is the standard
// "scale to cover, center-crop" formula for that behavior. Both the guide
// overlay and the live detected-face outline (components/scan/
// FacePositionOverlay.tsx) go through this same mapping so they land in
// the same coordinate space as what the user actually sees on screen;
// drawing raw normalized coordinates directly against the container
// (skipping this step) is exactly the kind of mismatch this module exists
// to rule out.
export type ObjectCoverMapping = {
  scale: number
  offsetX: number
  offsetY: number
  containerWidth: number
  containerHeight: number
}

export function computeObjectCoverMapping(
  videoWidth: number,
  videoHeight: number,
  containerWidth: number,
  containerHeight: number
): ObjectCoverMapping {
  const scale = Math.max(containerWidth / videoWidth, containerHeight / videoHeight)
  return {
    scale,
    offsetX: (videoWidth * scale - containerWidth) / 2,
    offsetY: (videoHeight * scale - containerHeight) / 2,
    containerWidth,
    containerHeight,
  }
}

// `nx`/`ny` are 0-1 fractions of the raw video frame. Returns a 0-1
// fraction of the displayed container (can fall outside 0-1 if the point
// lies in the portion `object-cover` cropped away).
export function mapNormalizedPoint(
  nx: number,
  ny: number,
  videoWidth: number,
  videoHeight: number,
  mapping: ObjectCoverMapping
): { x: number; y: number } {
  return {
    x: (nx * videoWidth * mapping.scale - mapping.offsetX) / mapping.containerWidth,
    y: (ny * videoHeight * mapping.scale - mapping.offsetY) / mapping.containerHeight,
  }
}

// `rawWidth`/`rawHeight` are 0-1 fractions of the raw video frame's own
// width/height. Returns a 0-1 fraction of the container's width/height —
// a pure size, so (unlike a point) it needs no offset correction.
export function mapNormalizedSize(
  rawWidth: number,
  rawHeight: number,
  videoWidth: number,
  videoHeight: number,
  mapping: ObjectCoverMapping
): { width: number; height: number } {
  return {
    width: (rawWidth * videoWidth * mapping.scale) / mapping.containerWidth,
    height: (rawHeight * videoHeight * mapping.scale) / mapping.containerHeight,
  }
}
