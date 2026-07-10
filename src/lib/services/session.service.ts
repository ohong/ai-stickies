import { cookies } from 'next/headers'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { getUser } from '@/src/lib/services/auth.service'
import { sessionConfig } from '@/src/lib/config'
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE } from '@/src/lib/constants/session'
import type { Session, Generation } from '@/src/types/database'

interface RateLimitResult {
  allowed: boolean
  remaining: number
  total: number
}

interface QuotaMutationResult {
  generationCount: number
  remaining: number
  total: number
}

/**
 * Get existing session by ID or return null
 */
export async function getSession(sessionId: string): Promise<Session | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (error || !data) return null
  return data
}

/**
 * Create a new session in database
 */
async function createSession(userId?: string): Promise<Session> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('sessions')
    .insert({
      generation_count: 0,
      max_generations: sessionConfig.maxGenerations,
      ...(userId ? { user_id: userId } : {}),
    })
    .select()
    .single()

  if (error || !data) {
    throw new Error(`Failed to create session: ${error?.message ?? 'Unknown error'}`)
  }

  return data
}

/**
 * Set session cookie
 */
export async function setSessionCookie(sessionId: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  })
}

/**
 * Get session ID from cookies
 */
export async function getSessionIdFromCookie(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null
}

/**
 * Get or create session from cookies.
 * If user is authenticated, look up session by user_id first.
 * Falls back to cookie-based session for anonymous users.
 */
export async function getOrCreateSession(): Promise<Session> {
  // Check for authenticated user first
  const user = await getUser()

  if (user) {
    const session = await getSessionByUserId(user.id)
    if (session) {
      await touchSession(session.id)
      await setSessionCookie(session.id)
      return session
    }
    // Authenticated user with no session — create one linked to their account
    const newSession = await createSession(user.id)
    await setSessionCookie(newSession.id)
    return newSession
  }

  // Anonymous flow: use cookie-based session
  const cookieStore = await cookies()
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (sessionId) {
    const session = await getSession(sessionId)
    if (session) {
      // Update last_active_at
      await touchSession(sessionId)
      return session
    }
    // Session not found in DB - create new one
  }

  // Create new session
  const newSession = await createSession()
  await setSessionCookie(newSession.id)
  return newSession
}

/**
 * Get session by user_id
 */
export async function getSessionByUserId(userId: string): Promise<Session | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .order('last_active_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) return null
  return data
}

function mapQuotaMutationRow(row: {
  generation_count: number
  max_generations: number
  remaining: number
}): QuotaMutationResult {
  return {
    generationCount: row.generation_count,
    remaining: row.remaining,
    total: row.max_generations,
  }
}

/**
 * Check if user can generate more stickers
 */
export async function checkRateLimit(sessionId: string): Promise<RateLimitResult> {
  const session = await getSession(sessionId)

  if (!session) {
    return {
      allowed: false,
      remaining: 0,
      total: sessionConfig.maxGenerations,
    }
  }

  const remaining = Math.max(0, session.max_generations - session.generation_count)

  return {
    allowed: remaining > 0,
    remaining,
    total: session.max_generations,
  }
}

/**
 * Atomically reserve generation quota for a session.
 * Throws when the quota would be exceeded.
 */
export async function reserveGenerationCount(
  sessionId: string,
  amount = 1
): Promise<QuotaMutationResult> {
  const supabase = createAdminClient()

  const { data, error } = await supabase.rpc('reserve_session_generations', {
    p_session_id: sessionId,
    p_amount: amount,
  })

  if (error) {
    if (error.message.includes('RATE_LIMIT_EXCEEDED')) {
      throw new Error('No generations remaining')
    }
    throw new Error(`Failed to reserve generation quota: ${error.message}`)
  }

  const row = Array.isArray(data) ? data[0] : data
  if (!row) {
    throw new Error('Failed to reserve generation quota')
  }

  return mapQuotaMutationRow(row)
}

/**
 * Atomically refund generation quota for a session.
 */
export async function refundGenerationCount(
  sessionId: string,
  amount = 1
): Promise<QuotaMutationResult> {
  const supabase = createAdminClient()

  const { data, error } = await supabase.rpc('refund_session_generations', {
    p_session_id: sessionId,
    p_amount: amount,
  })

  if (error) {
    throw new Error(`Failed to refund generation quota: ${error.message}`)
  }

  const row = Array.isArray(data) ? data[0] : data
  if (!row) {
    throw new Error('Failed to refund generation quota')
  }

  return mapQuotaMutationRow(row)
}

/**
 * Backwards-compatible single-generation reservation.
 */
export async function incrementGenerationCount(sessionId: string): Promise<number> {
  const result = await reserveGenerationCount(sessionId, 1)
  return result.generationCount
}

/**
 * Get all generations for a session (history)
 */
export async function getSessionHistory(sessionId: string): Promise<Generation[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('generations')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch session history: ${error.message}`)
  }

  return data ?? []
}

/**
 * Get all generations visible to a request actor.
 */
export async function getSessionHistoryForActor(
  sessionId: string,
  userId?: string | null
): Promise<Generation[]> {
  const supabase = createAdminClient()
  let query = supabase
    .from('generations')
    .select('*')
    .order('created_at', { ascending: false })

  if (userId) {
    query = query.or(`session_id.eq.${sessionId},user_id.eq.${userId}`)
  } else {
    query = query.eq('session_id', sessionId)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch session history: ${error.message}`)
  }

  return data ?? []
}

/**
 * Update session's last_active_at timestamp
 */
export async function touchSession(sessionId: string): Promise<void> {
  const supabase = createAdminClient()

  await supabase
    .from('sessions')
    .update({ last_active_at: new Date().toISOString() })
    .eq('id', sessionId)
}

/**
 * Get style preview count for a generation
 */
export async function getStylePreviewCount(generationId: string): Promise<number> {
  const supabase = createAdminClient()

  const { count, error } = await supabase
    .from('style_previews')
    .select('*', { count: 'exact', head: true })
    .eq('generation_id', generationId)

  if (error) return 0
  return count ?? 0
}
