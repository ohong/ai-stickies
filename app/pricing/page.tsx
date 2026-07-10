import { Header } from '@/app/components/layout/header'
import { Footer } from '@/app/components/layout/footer'
import { getCreditPacks } from '@/src/lib/services/credits.service'
import { createClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { CreditPackCard } from '@/app/components/pricing/credit-pack-card'

export const metadata = {
  title: 'Pricing',
  description: 'Buy credits to generate AI sticker packs.',
}

export const dynamic = 'force-dynamic'

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; canceled?: string }>
}) {
  const params = await searchParams
  let packs: Awaited<ReturnType<typeof getCreditPacks>> = []
  let packError: string | null = null

  try {
    packs = await getCreditPacks()
  } catch {
    packError = 'Credit packs are temporarily unavailable. Please try again soon.'
  }

  // Try to get current user's balance (if logged in)
  let creditBalance: number | null = null
  try {
    const supabaseAuth = await createClient()
    const { data: { user } } = await supabaseAuth.auth.getUser()
    if (user) {
      const supabase = createAdminClient()
      const { data: profile } = await supabase
        .from('profiles')
        .select('credit_balance')
        .eq('id', user.id)
        .single()
      creditBalance = profile?.credit_balance ?? null
    }
  } catch {
    // Not logged in — that's fine
  }

  return (
    <div className="min-h-dvh bg-background font-sans">
      <Header />
      <main id="main-content" className="pt-24 pb-16 px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Buy Credits
          </h1>
          <p className="mt-3 text-muted-foreground">
            Each sticker pack generation costs 1 credit.
          </p>

          {creditBalance !== null && (
            <p className="mt-2 text-sm font-medium text-foreground">
              Your balance: {creditBalance} credit{creditBalance !== 1 ? 's' : ''}
            </p>
          )}

          {params.success === 'true' && (
            <div className="mt-6 rounded-lg border border-primary/25 bg-primary/10 px-4 py-3 text-left text-sm text-foreground">
              Payment received. Credits can take a few seconds to appear while Stripe confirms the purchase.
            </div>
          )}

          {params.canceled === 'true' && (
            <div className="mt-6 rounded-lg border border-border bg-muted/60 px-4 py-3 text-left text-sm text-muted-foreground">
              Checkout was canceled. No credits were purchased.
            </div>
          )}

          {packError && (
            <div className="mt-6 rounded-lg border border-destructive/25 bg-destructive/10 px-4 py-3 text-left text-sm text-destructive">
              {packError}
            </div>
          )}
        </div>

        {packs.length > 0 && (
          <div className="mx-auto mt-10 grid max-w-3xl gap-6 sm:grid-cols-3">
            {packs.map((pack, i) => (
              <CreditPackCard
                key={pack.id}
                pack={pack}
                highlighted={i === 1}
              />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
