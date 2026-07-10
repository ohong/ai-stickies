#!/usr/bin/env bun

import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

interface CreditPackRow {
  id: string
  name: string
  price_cents: number
  stripe_price_id: string
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SECRET_KEY
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY')
    process.exit(1)
  }

  if (!stripeSecretKey) {
    console.error('Missing STRIPE_SECRET_KEY')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  const { data, error } = await supabase
    .from('credit_packs')
    .select('id,name,price_cents,stripe_price_id')
    .eq('is_active', true)
    .order('price_cents', { ascending: true })

  if (error) {
    console.error(`Failed to fetch credit packs: ${error.message}`)
    process.exit(1)
  }

  const packs = (data ?? []) as CreditPackRow[]

  if (packs.length === 0) {
    console.error('No active credit packs found. Checkout cannot sell credits.')
    process.exit(1)
  }

  const placeholderRows = packs.filter((pack) =>
    String(pack.stripe_price_id).includes('placeholder')
  )

  let failureCount = 0

  if (placeholderRows.length > 0) {
    failureCount += placeholderRows.length
    console.error('Found active credit packs with placeholder Stripe price IDs:')
    for (const pack of placeholderRows) {
      console.error(`- ${pack.name} (${pack.id}): ${pack.stripe_price_id}`)
    }
    console.error('Update these rows with real Stripe Price IDs before enabling checkout.')
  }

  const stripe = new Stripe(stripeSecretKey, { typescript: true })

  for (const pack of packs) {
    if (pack.stripe_price_id.includes('placeholder')) continue

    try {
      const price = await stripe.prices.retrieve(pack.stripe_price_id)
      if ('deleted' in price && price.deleted) {
        failureCount += 1
        console.error(`${pack.name}: Stripe price ${pack.stripe_price_id} is deleted`)
        continue
      }

      if (!price.active) {
        failureCount += 1
        console.error(`${pack.name}: Stripe price ${pack.stripe_price_id} is inactive`)
      }

      if (price.unit_amount !== pack.price_cents) {
        failureCount += 1
        console.error(
          `${pack.name}: Stripe price amount ${price.unit_amount ?? 'null'} does not match database amount ${pack.price_cents}`
        )
      }

      if (price.type !== 'one_time') {
        failureCount += 1
        console.error(`${pack.name}: Stripe price ${pack.stripe_price_id} is ${price.type}, expected one_time`)
      }
    } catch (error) {
      failureCount += 1
      const detail = error instanceof Error ? error.message : String(error)
      console.error(`${pack.name}: failed to retrieve Stripe price ${pack.stripe_price_id}: ${detail}`)
    }
  }

  if (failureCount > 0) {
    console.error(`Stripe price verification failed with ${failureCount} issue(s).`)
    process.exit(1)
  }

  console.log('All active credit packs have valid, active one-time Stripe price IDs.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
