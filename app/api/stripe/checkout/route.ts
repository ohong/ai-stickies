/**
 * POST /api/stripe/checkout
 * Creates a Stripe Checkout Session for purchasing a credit pack.
 * Requires authentication (designed to work with WS1 auth).
 */

import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/src/lib/stripe/client'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { createClient } from '@/src/lib/supabase/server'

interface CheckoutRequest {
  creditPackId: string
}

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe()

    // Auth check: get user from Supabase session
    const supabaseAuth = await createClient()
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    const body = await request.json() as CheckoutRequest
    const { creditPackId } = body

    if (!creditPackId) {
      return NextResponse.json(
        { error: 'creditPackId is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Look up credit pack
    const { data: pack, error: packError } = await supabase
      .from('credit_packs')
      .select('*')
      .eq('id', creditPackId)
      .eq('is_active', true)
      .single()

    if (packError || !pack) {
      return NextResponse.json(
        { error: 'Credit pack not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    if (pack.stripe_price_id.includes('placeholder')) {
      return NextResponse.json(
        { error: 'Credit pack is not configured for checkout', code: 'PRICE_NOT_CONFIGURED' },
        { status: 503 }
      )
    }

    // Get or create Stripe customer
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found', code: 'PROFILE_NOT_FOUND' },
        { status: 404 }
      )
    }

    let stripeCustomerId = profile.stripe_customer_id

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      })
      stripeCustomerId = customer.id

      await supabase
        .from('profiles')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', user.id)
    }

    // Determine URLs
    const origin = request.headers.get('origin') ?? 'http://localhost:3000'

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer: stripeCustomerId,
      line_items: [
        {
          price: pack.stripe_price_id,
          quantity: 1,
        },
      ],
      success_url: `${origin}/pricing?success=true`,
      cancel_url: `${origin}/pricing?canceled=true`,
      metadata: {
        user_id: user.id,
        credit_pack_id: pack.id,
      },
    })

    // Create pending purchase record
    const { error: purchaseError } = await supabase
      .from('purchases')
      .insert({
        user_id: user.id,
        stripe_session_id: session.id,
        credit_pack_id: pack.id,
        credits_purchased: pack.credits,
        amount_cents: pack.price_cents,
        status: 'pending',
      })

    if (purchaseError) {
      console.error('Failed to create purchase record:', purchaseError.message)
      return NextResponse.json(
        { error: 'Failed to create purchase record' },
        { status: 500 }
      )
    }

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
