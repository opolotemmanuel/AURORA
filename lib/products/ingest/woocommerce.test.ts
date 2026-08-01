// All fetch calls in this file are mocked — zero real network calls to
// auroraorganics.co. Every test stubs `global.fetch` before importing/
// invoking fetchWooCommerceProducts.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { buildProducts, normalInStockProduct } from "./__fixtures__/woocommerce-products.ts"
import { fetchWooCommerceProducts } from "./woocommerce.ts"

function jsonResponse(body: unknown, init: { status?: number; headers?: Record<string, string> } = {}) {
  const status = init.status ?? 200
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...init.headers },
  })
}

describe("fetchWooCommerceProducts", () => {
  beforeEach(() => {
    vi.stubEnv("WOOCOMMERCE_CONSUMER_KEY", "ck_test")
    vi.stubEnv("WOOCOMMERCE_CONSUMER_SECRET", "cs_test")
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it("throws a clear error when credentials are missing, without calling fetch", async () => {
    vi.unstubAllEnvs()
    const fetchSpy = vi.fn()
    vi.stubGlobal("fetch", fetchSpy)

    await expect(fetchWooCommerceProducts()).rejects.toThrow(/WOOCOMMERCE_CONSUMER_KEY/)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it("pages through all products instead of stopping at the first page", async () => {
    const page1 = buildProducts(100, 0)
    const page2 = buildProducts(37, 100)
    const fetchSpy = vi.fn(async (input: string | URL) => {
      const url = new URL(input)
      const page = url.searchParams.get("page")
      return page === "1" ? jsonResponse(page1) : jsonResponse(page2)
    })
    vi.stubGlobal("fetch", fetchSpy)

    const products = await fetchWooCommerceProducts()

    expect(products).toHaveLength(137)
    expect(fetchSpy).toHaveBeenCalledTimes(2)
    // Confirms the short (37-item) page correctly signals "no more pages" —
    // a third call would mean the loop kept going past the end.
    expect(products[136].slug).toBe("fixture-product-137")
  })

  it("stops after a single page when the first page is already short", async () => {
    const fetchSpy = vi.fn(async () => jsonResponse([normalInStockProduct]))
    vi.stubGlobal("fetch", fetchSpy)

    const products = await fetchWooCommerceProducts()

    expect(products).toHaveLength(1)
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it("fails loudly on a network error instead of returning an empty list", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("fetch failed")
      }),
    )

    await expect(fetchWooCommerceProducts()).rejects.toThrow(/Could not reach the WooCommerce store/)
  })

  it("fails loudly with a specific message on 401/403 auth failures", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ code: "woocommerce_rest_authentication_error" }, { status: 401 })),
    )

    await expect(fetchWooCommerceProducts()).rejects.toThrow(/rejected our credentials \(401\)/)
  })

  it("fails loudly with a specific message on 429 rate limiting, including Retry-After", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ code: "rate_limited" }, { status: 429, headers: { "retry-after": "30" } })),
    )

    await expect(fetchWooCommerceProducts()).rejects.toThrow(/rate-limited.*Retry after 30s/)
  })

  it("fails loudly on other non-OK statuses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("Internal Server Error", { status: 500 })),
    )

    await expect(fetchWooCommerceProducts()).rejects.toThrow(/WooCommerce API failed \(500\)/)
  })

  it("fails loudly when the response body isn't valid JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("<html>not json</html>", { status: 200 })),
    )

    await expect(fetchWooCommerceProducts()).rejects.toThrow(/isn't valid JSON/)
  })

  it("fails loudly when the response shape isn't an array of products", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ code: "unexpected_object_instead_of_array" })),
    )

    await expect(fetchWooCommerceProducts()).rejects.toThrow(/unexpected response shape/)
  })
})
