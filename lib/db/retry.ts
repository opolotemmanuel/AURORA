const RETRYABLE_CODES = new Set([
  "ETIMEDOUT",
  "ECONNRESET",
  "ECONNREFUSED",
  "ENOTFOUND",
  "EAI_AGAIN",
  "P1001",
  "P1008",
  "P1017",
])

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isRetryableDbError(error: unknown) {
  if (!error || typeof error !== "object") return false

  const code =
    "code" in error && typeof error.code === "string" ? error.code : undefined

  if (code && RETRYABLE_CODES.has(code)) return true

  const message =
    "message" in error && typeof error.message === "string"
      ? error.message
      : ""

  return /timeout|timed out|connection|ECONN/i.test(message)
}

export async function withDbRetry<T>(
  operation: () => Promise<T>,
  retries = 3,
): Promise<T> {
  let lastError: unknown

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      if (!isRetryableDbError(error) || attempt === retries) {
        throw error
      }
      await sleep(400 * (attempt + 1))
    }
  }

  throw lastError
}
