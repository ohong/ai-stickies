'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/src/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  })

  useEffect(() => {
    const supabase = createClient()

    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setState({
        user,
        isLoading: false,
        isAuthenticated: !!user,
      })
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const user = session?.user ?? null

        setState({
          user,
          isLoading: false,
          isAuthenticated: !!user,
        })

        // On sign-in, migrate anonymous session data to the user account
        if (event === 'SIGNED_IN' && user) {
          await migrateSession(user.id)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signOut = useCallback(async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setState({ user: null, isLoading: false, isAuthenticated: false })
  }, [])

  return {
    ...state,
    signOut,
  }
}

/**
 * Call the server to migrate the anonymous cookie-based session
 * to the newly authenticated user.
 */
async function migrateSession(userId: string): Promise<void> {
  // Read the session cookie value — it's httpOnly so we can't read it directly.
  // Instead, call the migration API endpoint which reads the cookie server-side.
  try {
    await fetch('/api/auth/migrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
  } catch {
    // Migration is best-effort — don't block the auth flow
    console.error('Session migration failed')
  }
}
