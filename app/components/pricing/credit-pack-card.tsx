'use client'

import { useState } from 'react'
import type { CreditPack } from '@/src/lib/services/credits.service'

interface CreditPackCardProps {
  pack: CreditPack
  highlighted?: boolean
}

export function CreditPackCard({ pack, highlighted = false }: CreditPackCardProps) {
  const [loading, setLoading] = useState(false)

  const priceDisplay = (pack.price_cents / 100).toFixed(2)
  const perCredit = (pack.price_cents / pack.credits / 100).toFixed(2)

  async function handleBuy() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creditPackId: pack.id }),
      })

      if (!res.ok) {
        const data = await res.json()
        if (data.code === 'UNAUTHORIZED') {
          window.location.href = '/login?next=/pricing'
          return
        }
        throw new Error(data.error ?? 'Checkout failed')
      }

      const { url } = await res.json()
      if (url) {
        window.location.href = url
      }
    } catch (err) {
      console.error('Checkout error:', err)
      alert(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-6 ${
        highlighted
          ? 'border-primary bg-primary/5 shadow-lg'
          : 'border-border bg-card'
      }`}
    >
      {highlighted && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
          Best Value
        </span>
      )}

      <h3 className="text-lg font-semibold text-foreground">{pack.name}</h3>

      <div className="mt-4">
        <span className="text-3xl font-bold text-foreground">${priceDisplay}</span>
      </div>

      <p className="mt-2 text-sm text-muted-foreground">
        {pack.credits} credits &middot; ${perCredit}/credit
      </p>

      <button
        onClick={handleBuy}
        disabled={loading}
        className={`mt-6 w-full rounded-full py-2.5 text-sm font-semibold transition-transform active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
          highlighted
            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
            : 'bg-foreground text-background hover:bg-foreground/90'
        }`}
      >
        {loading ? 'Redirecting...' : 'Buy Credits'}
      </button>
    </div>
  )
}
