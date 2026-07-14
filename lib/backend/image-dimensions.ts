// Best-effort pixel-dimension sniffing straight from the file's magic bytes.
// sharp (added for lib/backend/image-lighting.ts) could do this too, but a
// technical-details "Image Resolution" field doesn't warrant decoding the
// full image just for its header dimensions. Returns null on anything
// unexpected rather than throwing, since this is side metadata for a report
// and must never break the scan upload itself.
export function readImageDimensions(
  buffer: Buffer,
  mimeType: string,
): { width: number; height: number } | null {
  try {
    if (mimeType === "image/png") return readPngDimensions(buffer)
    if (mimeType === "image/jpeg") return readJpegDimensions(buffer)
    if (mimeType === "image/webp") return readWebpDimensions(buffer)
  } catch {
    return null
  }
  return null
}

function readPngDimensions(buffer: Buffer) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  if (buffer.length < 24 || !buffer.subarray(0, 8).equals(signature)) return null

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  }
}

// Walks JPEG markers from the SOI looking for a start-of-frame marker
// (0xC0-0xCF, excluding the DHT/JPG/DAC markers which share that range) —
// the first SOF segment carries the image's real height/width.
function readJpegDimensions(buffer: Buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null

  let offset = 2
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) return null
    const marker = buffer[offset + 1]
    const isSofMarker =
      marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc

    if (isSofMarker) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      }
    }

    const segmentLength = buffer.readUInt16BE(offset + 2)
    offset += 2 + segmentLength
  }

  return null
}

function readWebpDimensions(buffer: Buffer) {
  if (buffer.length < 30 || buffer.toString("ascii", 0, 4) !== "RIFF") return null
  if (buffer.toString("ascii", 8, 12) !== "WEBP") return null

  const chunkId = buffer.toString("ascii", 12, 16)

  if (chunkId === "VP8X") {
    return {
      width: 1 + (buffer.readUIntLE(24, 3) & 0xffffff),
      height: 1 + (buffer.readUIntLE(27, 3) & 0xffffff),
    }
  }

  if (chunkId === "VP8L" && buffer[20] === 0x2f) {
    const bits = buffer.readUInt32LE(21)
    return {
      width: 1 + (bits & 0x3fff),
      height: 1 + ((bits >> 14) & 0x3fff),
    }
  }

  if (chunkId === "VP8 ") {
    // Lossy stream: a 3-byte frame tag, then a 3-byte start code
    // (0x9d 0x01 0x2a), then 2 bytes width / 2 bytes height (14 bits each).
    if (buffer[23] !== 0x9d || buffer[24] !== 0x01 || buffer[25] !== 0x2a) return null
    return {
      width: buffer.readUInt16LE(26) & 0x3fff,
      height: buffer.readUInt16LE(28) & 0x3fff,
    }
  }

  return null
}
