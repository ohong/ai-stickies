/**
 * GET /api/credits/balance
 * Returns the authenticated user's credit balance.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { getCreditBalance } from '@/src/lib/services/credits.service'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const balance = await getCreditBalance(user.id)
    return NextResponse.json({ balance })
  } catch (err) {
    console.error('Failed to get credit balance:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
