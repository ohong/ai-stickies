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
  createClient: vi.fn(),
}))
