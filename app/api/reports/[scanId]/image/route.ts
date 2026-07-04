import { NextResponse } from "next/server"

import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db/client"

type RouteContext = {
  params: Promise<{ scanId: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { scanId } = await context.params
  const scan = await prisma.scan.findFirst({
    where: { id: scanId, userId: session.user.id },
    select: {
      imageRetained: true,
      imageMimeType: true,
      imageData: true,
    },
  })

  if (!scan?.imageRetained || !scan.imageData) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 })
  }

  const mimeType = scan.imageMimeType ?? "image/jpeg"

  return new NextResponse(new Uint8Array(scan.imageData), {
    headers: {
      "Content-Type": mimeType,
      "Cache-Control": "private, max-age=3600",
    },
  })
}
