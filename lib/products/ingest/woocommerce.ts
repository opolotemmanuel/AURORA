// WooCommerce REST v3 client. Pure fetch logic, no database access — kept
// dependency-free of Prisma so this file (and everything that imports it)
// can run either inside Next.js or standalone via plain `node` for the
// manual sync script (see scripts/sync-products.ts).
import { AURORA_STORE_ORIGIN } from "../constants.ts"
import type { WooCommerceProduct } from "./types.ts"

function getCredentials() {
  const consumerKey = process.env.WOOCOMMERCE_CONSUMER_KEY?.trim()
  const consumerSecret = process.env.WOOCOMMERCE_CONSUMER_SECRET?.trim()

  if (!consumerKey || !consumerSecret) {
    throw new Error(
      "WooCommerce credentials are not configured. Set WOOCOMMERCE_CONSUMER_KEY and WOOCOMMERCE_CONSUMER_SECRET in .env.local.",
    )
  }

  return { consumerKey, consumerSecret }
}

function buildAuthHeader(consumerKey: string, consumerSecret: string): string {
  const token = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64")
  return `Basic ${token}`
}

// Fetches every *published* product from the real Aurora Organics store,
// paginating until a short page signals the end. `status=publish` matches
// wyasyn/review's approach — unpublished/draft WooCommerce products should
// never reach our catalog.
export async function fetchWooCommerceProducts(): Promise<WooCommerceProduct[]> {
  const { consumerKey, consumerSecret } = getCredentials()
  const authHeader = buildAuthHeader(consumerKey, consumerSecret)

  const products: WooCommerceProduct[] = []
  let page = 1
  const perPage = 100

  while (true) {
    const url = new URL("/wp-json/wc/v3/products", AURORA_STORE_ORIGIN)
    url.searchParams.set("per_page", String(perPage))
    url.searchParams.set("page", String(page))
    url.searchParams.set("status", "publish")

    let response: Response
    try {
      response = await fetch(url, {
        headers: {
          Authorization: authHeader,
          Accept: "application/json",
        },
      })
    } catch (cause) {
      throw new Error(
        `Could not reach the WooCommerce store at ${AURORA_STORE_ORIGIN} (page ${page}). The site may be down or unreachable from this network.`,
        { cause },
      )
    }

    if (response.status === 401 || response.status === 403) {
      throw new Error(
        `WooCommerce rejected our credentials (${response.status}) on page ${page}. Check WOOCOMMERCE_CONSUMER_KEY and WOOCOMMERCE_CONSUMER_SECRET in .env.local.`,
      )
    }

    if (response.status === 429) {
      const retryAfter = response.headers.get("retry-after")
      throw new Error(
        `WooCommerce rate-limited this request (429) on page ${page}.${retryAfter ? ` Retry after ${retryAfter}s.` : ""} Re-run the sync later.`,
      )
    }

    if (!response.ok) {
      throw new Error(`WooCommerce API failed (${response.status}) on page ${page}: ${await response.text()}`)
    }

    let batch: unknown
    try {
      batch = await response.json()
    } catch (cause) {
      throw new Error(`WooCommerce returned a response on page ${page} that isn't valid JSON.`, { cause })
    }

    if (!Array.isArray(batch)) {
      throw new Error(
        `WooCommerce returned an unexpected response shape on page ${page} (expected an array of products, got ${typeof batch}).`,
      )
    }

    products.push(...(batch as WooCommerceProduct[]))

    if (batch.length < perPage) {
      break
    }

    page += 1
  }

  return products
}
