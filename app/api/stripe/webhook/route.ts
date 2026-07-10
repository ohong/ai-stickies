/**
 * POST /api/stripe/webhook
 * Handles Stripe webhook events (checkout.session.completed)
 */

import { NextResponse } from 'next/server'
import { getStripe } from '@/src/lib/stripe/client'
import { stripeConfig } from '@/src/lib/config'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { completePurchase } from '@/src/lib/services/credits.service'
import type { Purchase } from '@/src/types/database'
import type Stripe from 'stripe'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event
  try {
    event = getStripe().webhooks.constructEvent(body, signature, stripeConfig.webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`Webhook signature verification failed: ${message}`)
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        if (session.payment_status !== 'paid') {
          return NextResponse.json({ received: true })
        }
        await completeCheckoutSessionPurchase(session)
        break
      }
      case 'checkout.session.async_payment_succeeded': {
        await completeCheckoutSessionPurchase(event.data.object)
        break
      }
      case 'checkout.session.async_payment_failed': {
        await markCheckoutSessionPurchaseFailed(event.data.object)
        break
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`Webhook processing error: ${message}`)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

async function completeCheckoutSessionPurchase(
  session: Stripe.Checkout.Session
): Promise<void> {
  const purchase = await getOrCreatePurchaseForSession(session)

  if (purchase.status === 'completed') {
    return
  }

  await completePurchase(purchase.id)
}

async function markCheckoutSessionPurchaseFailed(
  session: Stripe.Checkout.Session
): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('purchases')
    .update({ status: 'failed' })
    .eq('stripe_session_id', session.id)
    .eq('status', 'pending')

  if (error) {
    throw new Error(`Failed to mark purchase failed: ${error.message}`)
  }
}

async function getOrCreatePurchaseForSession(
  session: Stripe.Checkout.Session
): Promise<Purchase> {
  const supabase = createAdminClient()
  const stripeSessionId = session.id

  const { data: existingPurchase, error: fetchError } = await supabase
    .from('purchases')
    .select('*')
    .eq('stripe_session_id', stripeSessionId)
    .maybeSingle()

  if (fetchError) {
    throw new Error(`Failed to fetch purchase: ${fetchError.message}`)
  }

  if (existingPurchase) {
    return existingPurchase as Purchase
  }

  const userId = session.metadata?.user_id
  const creditPackId = session.metadata?.credit_pack_id

  if (!userId || !creditPackId) {
    throw new Error(`Purchase metadata missing for session ${stripeSessionId}`)
  }

  const { data: pack, error: packError } = await supabase
    .from('credit_packs')
    .select('*')
    .eq('id', creditPackId)
    .single()

  if (packError || !pack) {
    throw new Error(`Credit pack not found: ${packError?.message ?? creditPackId}`)
  }

  const { data: insertedPurchase, error: insertError } = await supabase
    .from('purchases')
    .insert({
      user_id: userId,
      stripe_session_id: stripeSessionId,
      credit_pack_id: creditPackId,
      credits_purchased: pack.credits,
      amount_cents: session.amount_total ?? pack.price_cents,
      status: 'pending',
    })
    .select('*')
    .single()

  if (insertError || !insertedPurchase) {
    throw new Error(`Failed to create purchase: ${insertError?.message ?? 'Unknown error'}`)
  }

  return insertedPurchase as Purchase
}
