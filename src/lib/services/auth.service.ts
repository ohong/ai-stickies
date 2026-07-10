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
): Promise<string | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.rpc('merge_anonymous_session', {
    p_session_id: sessionId,
    p_user_id: userId,
  })

  if (error) {
    throw new Error(`Failed to migrate anonymous session: ${error.message}`)
  }

  return data ?? null
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
