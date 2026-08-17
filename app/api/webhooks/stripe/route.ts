import { NextResponse } from "next/server"
import type Stripe from "stripe"

import { finalizePaymentIntent } from "@/lib/billing/actions"
import { prisma } from "@/lib/db/client"
import { getPaymentDriver } from "@/lib/payments"
import { getStripeClient } from "@/lib/payments/stripe/client"

/**
 * Authoritative confirmation path. The client also confirms via
 * confirmStripePaymentAction right after Stripe.js resolves, but that's a
 * fast-path for the UI only — a closed tab or a network drop after payment
 * must not leave a paid Payment row stuck at "pending", so this webhook is
 * the source of truth. finalizePaymentIntent's compare-and-set makes running
 * both paths for the same payment safe.
 */
const HANDLED_EVENTS = new Set([
  "payment_intent.succeeded",
  "payment_intent.payment_failed",
  "payment_intent.canceled",
])

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    console.error("Stripe webhook received but STRIPE_WEBHOOK_SECRET is not set")
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 })
  }

  const signature = request.headers.get("stripe-signature")
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  const rawBody = await request.text()

  let event: Stripe.Event
  try {
    event = getStripeClient().webhooks.constructEvent(rawBody, signature, secret)
  } catch (error) {
    console.error("Stripe webhook signature verification failed", error)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  if (!HANDLED_EVENTS.has(event.type)) {
    return NextResponse.json({ ok: true, skipped: event.type })
  }

  const paymentIntent = event.data.object as Stripe.PaymentIntent
  const payment = await prisma.payment.findUnique({
    where: { providerRef: paymentIntent.id },
  })

  if (!payment) {
    console.warn(`Stripe webhook: no Payment row for ${paymentIntent.id}`)
    return NextResponse.json({ ok: true, skipped: "unknown_payment" })
  }

  // Re-retrieve rather than trust the event payload's fields directly, and
  // reuse the same driver the rest of billing goes through.
  const driver = getPaymentDriver()
  const intent = await driver.confirmIntent({
    ref: paymentIntent.id,
    amountCents: payment.amountCents,
    currency: payment.currency,
    previousStatus: payment.status,
  })

  const result = await finalizePaymentIntent(payment, intent)
  if (!result.ok) {
    console.error(
      `Stripe webhook: finalize failed for payment ${payment.id}`,
      result.error,
    )
  }

  return NextResponse.json({ ok: true })
}
