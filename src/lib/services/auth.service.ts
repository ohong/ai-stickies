import { createClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import type { User } from '@supabase/supabase-js'

/**
 * Get the currently authenticated user from the Supabase session.
 * Returns null if not authenticated.
 */
export async function getUser(): Promise<User | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/**
 * Require authentication — returns the user or throws a 401-style error.
 */
export async function requireAuth(): Promise<User> {
  const user = await getUser()
  if (!user) {
    throw new AuthError('Authentication required', 401)
  }
  return user
}

/**
 * Migrate an anonymous session to an authenticated user.
 * Updates user_id on the session and all its generations.
 */
export async function migrateAnonymousSession(
  sessionId: string,
  userId: string
): Promise<void> {
  const supabase = createAdminClient()

  // Check if user already has a session
  const { data: existingSession } = await supabase
    .from('sessions')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (existingSession) {
    // User already has a session — merge generation counts
    const { data: anonSession } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .is('user_id', null)
      .single()

    if (!anonSession) return // Nothing to migrate

    // Move generations from anonymous session to user's session
    await supabase
      .from('generations')
      .update({ session_id: existingSession.id, user_id: userId })
      .eq('session_id', sessionId)

    // Move uploads from anonymous session to user's session
    await supabase
      .from('uploads')
      .update({ session_id: existingSession.id })
      .eq('session_id', sessionId)

    // Update generation count on existing session
    const { count } = await supabase
      .from('generations')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', existingSession.id)

    await supabase
      .from('sessions')
      .update({
        generation_count: count ?? 0,
        last_active_at: new Date().toISOString(),
      })
      .eq('id', existingSession.id)

    // Delete the now-empty anonymous session
    await supabase
      .from('sessions')
      .delete()
      .eq('id', sessionId)
  } else {
    // No existing user session — claim the anonymous one
    await supabase
      .from('sessions')
      .update({ user_id: userId })
      .eq('id', sessionId)

    await supabase
      .from('generations')
      .update({ user_id: userId })
      .eq('session_id', sessionId)
  }
}

export class AuthError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message)
    this.name = 'AuthError'
  }
}
