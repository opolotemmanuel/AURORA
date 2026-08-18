import {
  buildAuthHeader,
  getWooCommerceConfig,
} from "@/lib/products/ingest/woocommerce"

export function isWooCommerceWritable(): boolean {
  return getWooCommerceConfig() !== null
}

type WooCommerceCoupon = {
  id: number
  code: string
}

/**
 * Creates a percent-off coupon in WooCommerce for one affiliate. The code
 * both gives the customer a discount and is how we find out, via the order
 * webhook, which affiliate to credit — see lib/affiliates/webhook.ts.
 */
export async function createAffiliateCoupon(input: {
  code: string
  discountPercent: number
}): Promise<WooCommerceCoupon> {
  const config = getWooCommerceConfig()
  if (!config) {
    throw new Error(
      "WooCommerce credentials are not configured. Set WOOCOMMERCE_CONSUMER_KEY and WOOCOMMERCE_CONSUMER_SECRET.",
    )
  }

  const url = new URL("/wp-json/wc/v3/coupons", config.storeUrl)

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: buildAuthHeader(config),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      code: input.code,
      discount_type: "percent",
      amount: String(input.discountPercent),
      individual_use: true,
      usage_limit_per_user: null,
    }),
  })

  if (!response.ok) {
    throw new Error(
      `WooCommerce coupon creation failed (${response.status}): ${await response.text()}`,
    )
  }

  const coupon = (await response.json()) as WooCommerceCoupon
  return { id: coupon.id, code: coupon.code }
}
