import Stripe from 'stripe'

let stripeClient: Stripe | null = null

export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('Missing required environment variable: STRIPE_SECRET_KEY')
  }

  stripeClient ??= new Stripe(process.env.STRIPE_SECRET_KEY, {
    typescript: true,
  })

  return stripeClient
}
