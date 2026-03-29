/**
 * POST /api/stripe/webhook
 * Handles Stripe webhook events (checkout.session.completed)
 */

import { NextResponse } from 'next/server'
import { stripe } from '@/src/lib/stripe/client'
import { stripeConfig } from '@/src/lib/config'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { addCredits } from '@/src/lib/services/credits.service'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event
  try {
    event = stripe.webhooks.constructEvent(body, signature, stripeConfig.webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`Webhook signature verification failed: ${message}`)
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const stripeSessionId = session.id

    try {
      const supabase = createAdminClient()

      // Look up the pending purchase
      const { data: purchase, error: fetchError } = await supabase
        .from('purchases')
        .select('*')
        .eq('stripe_session_id', stripeSessionId)
        .single()

      if (fetchError || !purchase) {
        console.error(`Purchase not found for session ${stripeSessionId}:`, fetchError?.message)
        return NextResponse.json({ error: 'Purchase not found' }, { status: 404 })
      }

      if (purchase.status === 'completed') {
        // Idempotent: already processed
        return NextResponse.json({ received: true })
      }

      // Update purchase status
      const { error: updateError } = await supabase
        .from('purchases')
        .update({ status: 'completed' })
        .eq('id', purchase.id)

      if (updateError) {
        console.error(`Failed to update purchase ${purchase.id}:`, updateError.message)
        return NextResponse.json({ error: 'Failed to update purchase' }, { status: 500 })
      }

      // Add credits to user
      await addCredits(purchase.user_id, purchase.credits_purchased)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error(`Webhook processing error: ${message}`)
      return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
    }
  }

  return NextResponse.json({ received: true })
}
