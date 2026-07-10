import { createAdminClient } from '@/src/lib/supabase/admin'
import type { Generation } from '@/src/types/database'

export interface CreditPack {
  id: string
  name: string
  credits: number
  price_cents: number
  stripe_price_id: string
  is_active: boolean
  created_at: string
}

/**
 * Get a user's current credit balance
 */
export async function getCreditBalance(userId: string): Promise<number> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('credit_balance')
    .eq('id', userId)
    .single()

  if (error || !data) {
    throw new Error(`Failed to get credit balance: ${error?.message ?? 'User not found'}`)
  }

  return data.credit_balance
}

/**
 * Check whether a user has credits remaining
 */
export async function checkCredits(userId: string): Promise<{ hasCredits: boolean; balance: number }> {
  const balance = await getCreditBalance(userId)
  return { hasCredits: balance > 0, balance }
}

/**
 * Deduct credits from user's balance atomically. Returns new balance.
 * Throws if the balance is too low.
 */
export async function deductCredits(userId: string, amount: number): Promise<number> {
  const supabase = createAdminClient()

  const { data, error } = await supabase.rpc('deduct_credits', {
    p_user_id: userId,
    p_amount: amount,
  })

  if (error) {
    if (error.message.includes('INSUFFICIENT_CREDITS')) {
      throw new Error('Insufficient credits')
    }
    throw new Error(`Failed to deduct credits: ${error.message}`)
  }

  return Number(data)
}

/**
 * Add credits to user's balance. Returns new balance.
 */
export async function addCredits(userId: string, amount: number): Promise<number> {
  const supabase = createAdminClient()

  const { data, error } = await supabase.rpc('add_credits', {
    p_user_id: userId,
    p_amount: amount,
  })

  if (error) {
    throw new Error(`Failed to add credits: ${error.message}`)
  }

  return Number(data)
}

/**
 * Grant credits and mark a purchase completed in one database transaction.
 * Returns the user's new balance.
 */
export async function completePurchase(purchaseId: string): Promise<number> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.rpc('complete_purchase', {
    p_purchase_id: purchaseId,
  })

  if (error) {
    throw new Error(`Failed to complete purchase: ${error.message}`)
  }

  return Number(data)
}

export async function startPackGenerationCharge(input: {
  generationId: string
  sessionId: string | null
  userId: string
  packCount: number
}): Promise<Generation> {
  const supabase = createAdminClient()

  const { data, error } = await supabase.rpc('start_pack_generation', {
    p_generation_id: input.generationId,
    p_session_id: input.sessionId,
    p_user_id: input.userId,
    p_pack_count: input.packCount,
  })

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    throw new Error('Failed to start pack generation')
  }

  return data as Generation
}

export async function refundPackGenerationCharge(
  generationId: string,
  amount: number
): Promise<number> {
  const supabase = createAdminClient()

  const { data, error } = await supabase.rpc('refund_pack_generation', {
    p_generation_id: generationId,
    p_amount: amount,
  })

  if (error) {
    throw new Error(`Failed to refund pack generation: ${error.message}`)
  }

  return Number(data ?? 0)
}

/**
 * Get all active credit packs
 */
export async function getCreditPacks(): Promise<CreditPack[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('credit_packs')
    .select('*')
    .eq('is_active', true)
    .order('price_cents', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch credit packs: ${error.message}`)
  }

  return data ?? []
}
