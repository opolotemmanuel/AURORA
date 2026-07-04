"use client"

import { ErrorView } from "@/components/errors/error-view"

export default function Error({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <ErrorView reset={reset} />
}
