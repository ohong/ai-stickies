import { createAdminClient } from '@/src/lib/supabase/admin'

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
 * Deduct 1 credit from user's balance. Returns new balance.
 * Throws if balance is already 0.
 */
export async function deductCredit(userId: string): Promise<number> {
  const supabase = createAdminClient()

  // Use rpc or manual read-then-write with a check
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('credit_balance')
    .eq('id', userId)
    .single()

  if (fetchError || !profile) {
    throw new Error(`User not found: ${fetchError?.message ?? 'Unknown'}`)
  }

  if (profile.credit_balance <= 0) {
    throw new Error('Insufficient credits')
  }

  const newBalance = profile.credit_balance - 1

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ credit_balance: newBalance })
    .eq('id', userId)

  if (updateError) {
    throw new Error(`Failed to deduct credit: ${updateError.message}`)
  }

  return newBalance
}

/**
 * Add credits to user's balance. Returns new balance.
 */
export async function addCredits(userId: string, amount: number): Promise<number> {
  const supabase = createAdminClient()

  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('credit_balance')
    .eq('id', userId)
    .single()

  if (fetchError || !profile) {
    throw new Error(`User not found: ${fetchError?.message ?? 'Unknown'}`)
  }

  const newBalance = profile.credit_balance + amount

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ credit_balance: newBalance })
    .eq('id', userId)

  if (updateError) {
    throw new Error(`Failed to add credits: ${updateError.message}`)
  }

  return newBalance
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
