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

/**
 * Get existing session by ID or return null
 */
async function getSession(sessionId: string): Promise<Session | null> {
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
async function setSessionCookie(sessionId: string): Promise<void> {
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
async function getSessionByUserId(userId: string): Promise<Session | null> {
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
 * Increment generation count for session
 * Returns new count
 */
export async function incrementGenerationCount(sessionId: string): Promise<number> {
  const supabase = createAdminClient()

  // Get current count
  const session = await getSession(sessionId)
  if (!session) {
    throw new Error('Session not found')
  }

  const newCount = session.generation_count + 1

  const { error } = await supabase
    .from('sessions')
    .update({
      generation_count: newCount,
      last_active_at: new Date().toISOString(),
    })
    .eq('id', sessionId)

  if (error) {
    throw new Error(`Failed to increment generation count: ${error.message}`)
  }

  return newCount
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
