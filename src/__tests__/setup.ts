import '@testing-library/jest-dom/vitest'

// Mock next/headers cookies
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve({
    get: vi.fn(),
    set: vi.fn(),
  })),
}))

// Mock Supabase clients
vi.mock('@/src/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))

vi.mock('@/src/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  })),
}))

vi.mock('@/src/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
  }),
}))

// Mock auth service — defaults to unauthenticated (null user)
vi.mock('@/src/lib/services/auth.service', () => ({
  getUser: vi.fn().mockResolvedValue(null),
  requireAuth: vi.fn().mockRejectedValue(new Error('Authentication required')),
  migrateAnonymousSession: vi.fn().mockResolvedValue(undefined),
  AuthError: class AuthError extends Error {
    status: number
    constructor(message: string, status: number) {
      super(message)
      this.name = 'AuthError'
      this.status = status
    }
  },
}))
