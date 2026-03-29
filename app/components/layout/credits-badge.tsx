'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

/**
 * Displays the user's credit balance in the header.
 * Only renders when the user is authenticated (WS1 auth).
 * Silently renders nothing if auth is not available.
 */
export function CreditsBadge() {
  const [balance, setBalance] = useState<number | null>(null)

  useEffect(() => {
    async function fetchBalance() {
      try {
        const res = await fetch('/api/credits/balance')
        if (!res.ok) return // Not logged in or endpoint not available
        const data = await res.json()
        if (typeof data.balance === 'number') {
          setBalance(data.balance)
        }
      } catch {
        // Silently fail — user may not be logged in
      }
    }
    fetchBalance()
  }, [])

  if (balance === null) return null

  return (
    <Link
      href="/pricing"
      className="hidden sm:flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-foreground hover:bg-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <span>{balance} credit{balance !== 1 ? 's' : ''}</span>
    </Link>
  )
}
