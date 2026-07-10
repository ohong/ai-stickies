import { describe, it, expect, vi, beforeEach } from 'vitest'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { getUser } from '@/src/lib/services/auth.service'
import { SESSION_COOKIE_NAME } from '@/src/lib/constants/session'
import { sessionConfig } from '@/src/lib/config'
import type { Session, Generation } from '@/src/types/database'

// ---------------------------------------------------------------------------
// Reusable mock Supabase client with chainable query builder
// ---------------------------------------------------------------------------

/**
 * Creates a chainable mock query builder where every method returns `this`
 * by default and any method can be overridden to act as a terminal (resolving
 * a result) per test.
 *
 * The `_result` is used as the default resolved value for `.single()` and
 * `.maybeSingle()`.
 */
function createMockQueryBuilder(defaultResult: {
  data?: unknown
  error?: { message: string } | null
  count?: number | null
} = { data: null, error: null }) {
  // Use a proxy so that any property access returns a chainable vi.fn()
  // without needing to enumerate every Supabase method up front.
  const calls: Record<string, ReturnType<typeof vi.fn>> = {}

  const builder: Record<string, ReturnType<typeof vi.fn>> = new Proxy(calls, {
    get(target, prop: string) {
      if (prop === '_calls') return target
      if (!target[prop]) {
        // By default every method chains (returns the builder)
        target[prop] = vi.fn().mockReturnValue(builder)
      }
      return target[prop]
    },
    set(target, prop: string, value) {
      target[prop] = value
      return true
    },
  }) as unknown as Record<string, ReturnType<typeof vi.fn>>

  // Pre-configure terminal methods with a default result
  builder.single = vi.fn().mockResolvedValue({ data: defaultResult.data, error: defaultResult.error ?? null })
  builder.maybeSingle = vi.fn().mockResolvedValue({ data: defaultResult.data, error: defaultResult.error ?? null })

  return builder
}

/**
 * Creates a mock Supabase client. Each call to `supabase.from(tableName)`
 * returns its own independent query builder so that separate queries within
 * the same function (e.g. a SELECT then an UPDATE) do not share mock state.
 *
 * Callers can pre-register per-table builders or rely on a default builder.
 */
function createMockSupabase() {
  const tableBuilders: Record<string, ReturnType<typeof createMockQueryBuilder>[]> = {}

  /**
   * Register a builder that will be returned for the *next* call to
   * `supabase.from(tableName)`. Multiple registrations for the same table
   * are returned in FIFO order.
   */
  function forTable(tableName: string, builder?: ReturnType<typeof createMockQueryBuilder>) {
    const b = builder ?? createMockQueryBuilder()
    if (!tableBuilders[tableName]) tableBuilders[tableName] = []
    tableBuilders[tableName].push(b)
    return b
  }

  const supabase = {
    from: vi.fn((tableName: string) => {
      const queue = tableBuilders[tableName]
      if (queue && queue.length > 0) {
        return queue.shift()!
      }
      // Fallback: create a fresh builder on the fly
      const b = createMockQueryBuilder()
      return b
    }),
  }

  return { supabase, forTable }
}

// ---------------------------------------------------------------------------
// Cookie mock helper
// ---------------------------------------------------------------------------

function mockCookieStore(values: Record<string, string> = {}) {
  const store = {
    get: vi.fn((name: string) => {
      const value = values[name]
      return value !== undefined ? { name, value } : undefined
    }),
    set: vi.fn(),
  }
  vi.mocked(cookies).mockResolvedValue(store as unknown as Awaited<ReturnType<typeof cookies>>)
  return store
}

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 'session-1',
    user_id: null,
    created_at: '2026-01-01T00:00:00Z',
    last_active_at: '2026-01-01T00:00:00Z',
    generation_count: 3,
    max_generations: sessionConfig.maxGenerations,
    ...overrides,
  }
}

function makeGeneration(overrides: Partial<Generation> = {}): Generation {
  return {
    id: 'gen-1',
    session_id: 'session-1',
    user_id: null,
    upload_id: 'upload-1',
    style_description: null,
    personal_context: null,
    language: 'en',
    status: 'completed',
    provider: 'fal',
    created_at: '2026-01-01T00:00:00Z',
    completed_at: '2026-01-01T01:00:00Z',
    pack_generation_started_at: null,
    pack_credit_cost: 0,
    pack_credits_refunded: 0,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Module import & reset
// ---------------------------------------------------------------------------

let getSessionIdFromCookie: typeof import('@/src/lib/services/session.service').getSessionIdFromCookie
let getOrCreateSession: typeof import('@/src/lib/services/session.service').getOrCreateSession
let checkRateLimit: typeof import('@/src/lib/services/session.service').checkRateLimit
let incrementGenerationCount: typeof import('@/src/lib/services/session.service').incrementGenerationCount
let reserveGenerationCount: typeof import('@/src/lib/services/session.service').reserveGenerationCount
let refundGenerationCount: typeof import('@/src/lib/services/session.service').refundGenerationCount
let getSessionHistory: typeof import('@/src/lib/services/session.service').getSessionHistory
let getSessionHistoryForActor: typeof import('@/src/lib/services/session.service').getSessionHistoryForActor
let getStylePreviewCount: typeof import('@/src/lib/services/session.service').getStylePreviewCount
let touchSession: typeof import('@/src/lib/services/session.service').touchSession

beforeEach(async () => {
  vi.clearAllMocks()
  vi.mocked(getUser).mockResolvedValue(null)

  const mod = await import('@/src/lib/services/session.service')
  getSessionIdFromCookie = mod.getSessionIdFromCookie
  getOrCreateSession = mod.getOrCreateSession
  checkRateLimit = mod.checkRateLimit
  incrementGenerationCount = mod.incrementGenerationCount
  reserveGenerationCount = mod.reserveGenerationCount
  refundGenerationCount = mod.refundGenerationCount
  getSessionHistory = mod.getSessionHistory
  getSessionHistoryForActor = mod.getSessionHistoryForActor
  getStylePreviewCount = mod.getStylePreviewCount
  touchSession = mod.touchSession
})

// =========================================================================
// getSessionIdFromCookie
// =========================================================================

describe('getSessionIdFromCookie', () => {
  it('returns the cookie value when present', async () => {
    mockCookieStore({ [SESSION_COOKIE_NAME]: 'abc-123' })

    const result = await getSessionIdFromCookie()
    expect(result).toBe('abc-123')
  })

  it('returns null when no cookie is set', async () => {
    mockCookieStore({})

    const result = await getSessionIdFromCookie()
    expect(result).toBeNull()
  })
})

// =========================================================================
// getOrCreateSession
// =========================================================================

describe('getOrCreateSession', () => {
  it('returns existing session when cookie is present and session exists in DB', async () => {
    const existingSession = makeSession({ id: 'existing-session' })
    mockCookieStore({ [SESSION_COOKIE_NAME]: 'existing-session' })

    const { supabase, forTable } = createMockSupabase()
    vi.mocked(createAdminClient).mockReturnValue(supabase as unknown as ReturnType<typeof createAdminClient>)

    // getSession query
    const selectBuilder = forTable('sessions')
    selectBuilder.single = vi.fn().mockResolvedValue({ data: existingSession, error: null })

    // touchSession query (update)
    const touchBuilder = forTable('sessions')
    touchBuilder.eq = vi.fn().mockResolvedValue({ data: null, error: null })

    const result = await getOrCreateSession()

    expect(result).toEqual(existingSession)
    expect(supabase.from).toHaveBeenCalledWith('sessions')
  })

  it('creates a new session when no cookie is present', async () => {
    const newSession = makeSession({ id: 'new-session', generation_count: 0 })
    mockCookieStore({})

    const { supabase, forTable } = createMockSupabase()
    vi.mocked(createAdminClient).mockReturnValue(supabase as unknown as ReturnType<typeof createAdminClient>)

    // createSession: insert -> select -> single
    const insertBuilder = forTable('sessions')
    insertBuilder.single = vi.fn().mockResolvedValue({ data: newSession, error: null })

    const result = await getOrCreateSession()

    expect(result).toEqual(newSession)
    expect(insertBuilder.insert).toHaveBeenCalledWith({
      generation_count: 0,
      max_generations: sessionConfig.maxGenerations,
    })
  })

  it('creates a new session when cookie exists but session is not in DB', async () => {
    const newSession = makeSession({ id: 'new-session', generation_count: 0 })
    mockCookieStore({ [SESSION_COOKIE_NAME]: 'stale-session' })

    const { supabase, forTable } = createMockSupabase()
    vi.mocked(createAdminClient).mockReturnValue(supabase as unknown as ReturnType<typeof createAdminClient>)

    // getSession returns null (session not found)
    const selectBuilder = forTable('sessions')
    selectBuilder.single = vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } })

    // createSession returns new session
    const insertBuilder = forTable('sessions')
    insertBuilder.single = vi.fn().mockResolvedValue({ data: newSession, error: null })

    const result = await getOrCreateSession()

    expect(result).toEqual(newSession)
    expect(insertBuilder.insert).toHaveBeenCalled()
  })

  it('sets the session cookie when an authenticated user has an existing session', async () => {
    const store = mockCookieStore({})
    const existingSession = makeSession({ id: 'user-session', user_id: 'user-1' })
    vi.mocked(getUser).mockResolvedValue({ id: 'user-1' } as any)

    const { supabase, forTable } = createMockSupabase()
    vi.mocked(createAdminClient).mockReturnValue(supabase as unknown as ReturnType<typeof createAdminClient>)

    const userSessionBuilder = forTable('sessions')
    userSessionBuilder.single = vi.fn().mockResolvedValue({ data: existingSession, error: null })

    const touchBuilder = forTable('sessions')
    touchBuilder.eq = vi.fn().mockResolvedValue({ data: null, error: null })

    const result = await getOrCreateSession()

    expect(result).toEqual(existingSession)
    expect(store.set).toHaveBeenCalledWith(
      SESSION_COOKIE_NAME,
      'user-session',
      expect.objectContaining({ httpOnly: true, path: '/' })
    )
  })
})

// =========================================================================
// checkRateLimit
// =========================================================================

describe('checkRateLimit', () => {
  it('returns allowed=true with remaining generations', async () => {
    const session = makeSession({ generation_count: 3, max_generations: 10 })
    const { supabase, forTable } = createMockSupabase()
    vi.mocked(createAdminClient).mockReturnValue(supabase as unknown as ReturnType<typeof createAdminClient>)

    const builder = forTable('sessions')
    builder.single = vi.fn().mockResolvedValue({ data: session, error: null })

    const result = await checkRateLimit('session-1')

    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(7)
    expect(result.total).toBe(sessionConfig.maxGenerations)
  })

  it('returns allowed=false when generations are exhausted', async () => {
    const session = makeSession({ generation_count: 10, max_generations: 10 })
    const { supabase, forTable } = createMockSupabase()
    vi.mocked(createAdminClient).mockReturnValue(supabase as unknown as ReturnType<typeof createAdminClient>)

    const builder = forTable('sessions')
    builder.single = vi.fn().mockResolvedValue({ data: session, error: null })

    const result = await checkRateLimit('session-1')

    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
    expect(result.total).toBe(sessionConfig.maxGenerations)
  })

  it('returns allowed=false when session is not found', async () => {
    const { supabase, forTable } = createMockSupabase()
    vi.mocked(createAdminClient).mockReturnValue(supabase as unknown as ReturnType<typeof createAdminClient>)

    const builder = forTable('sessions')
    builder.single = vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } })

    const result = await checkRateLimit('nonexistent')

    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
    expect(result.total).toBe(sessionConfig.maxGenerations)
  })

  it('clamps remaining to 0 when generation_count exceeds max_generations', async () => {
    const session = makeSession({ generation_count: 15, max_generations: 10 })
    const { supabase, forTable } = createMockSupabase()
    vi.mocked(createAdminClient).mockReturnValue(supabase as unknown as ReturnType<typeof createAdminClient>)

    const builder = forTable('sessions')
    builder.single = vi.fn().mockResolvedValue({ data: session, error: null })

    const result = await checkRateLimit('session-1')

    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })
})

// =========================================================================
// incrementGenerationCount
// =========================================================================

describe('incrementGenerationCount', () => {
  it('increments the generation count and returns the new value', async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [{ generation_count: 6, max_generations: 10, remaining: 4 }],
      error: null,
    })
    vi.mocked(createAdminClient).mockReturnValue({ rpc } as unknown as ReturnType<typeof createAdminClient>)

    const newCount = await incrementGenerationCount('session-1')

    expect(newCount).toBe(6)
    expect(rpc).toHaveBeenCalledWith('reserve_session_generations', {
      p_session_id: 'session-1',
      p_amount: 1,
    })
  })

  it('throws when session is not found', async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'RATE_LIMIT_EXCEEDED' },
    })
    vi.mocked(createAdminClient).mockReturnValue({ rpc } as unknown as ReturnType<typeof createAdminClient>)

    await expect(incrementGenerationCount('nonexistent')).rejects.toThrow('No generations remaining')
  })

  it('throws on DB update error', async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'update failed' },
    })
    vi.mocked(createAdminClient).mockReturnValue({ rpc } as unknown as ReturnType<typeof createAdminClient>)

    await expect(incrementGenerationCount('session-1')).rejects.toThrow(
      'Failed to reserve generation quota: update failed'
    )
  })
})

describe('reserveGenerationCount and refundGenerationCount', () => {
  it('reserves session quota through the reserve RPC', async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [{ generation_count: 5, max_generations: 10, remaining: 5 }],
      error: null,
    })
    vi.mocked(createAdminClient).mockReturnValue({ rpc } as unknown as ReturnType<typeof createAdminClient>)

    await expect(reserveGenerationCount('session-1', 2)).resolves.toEqual({
      generationCount: 5,
      remaining: 5,
      total: 10,
    })

    expect(rpc).toHaveBeenCalledWith('reserve_session_generations', {
      p_session_id: 'session-1',
      p_amount: 2,
    })
  })

  it('refunds session quota through the refund RPC', async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [{ generation_count: 3, max_generations: 10, remaining: 7 }],
      error: null,
    })
    vi.mocked(createAdminClient).mockReturnValue({ rpc } as unknown as ReturnType<typeof createAdminClient>)

    await expect(refundGenerationCount('session-1', 2)).resolves.toEqual({
      generationCount: 3,
      remaining: 7,
      total: 10,
    })

    expect(rpc).toHaveBeenCalledWith('refund_session_generations', {
      p_session_id: 'session-1',
      p_amount: 2,
    })
  })
})

// =========================================================================
// getSessionHistory
// =========================================================================

describe('getSessionHistory', () => {
  it('returns generations for the session', async () => {
    const generations = [
      makeGeneration({ id: 'gen-1' }),
      makeGeneration({ id: 'gen-2' }),
    ]
    const { supabase, forTable } = createMockSupabase()
    vi.mocked(createAdminClient).mockReturnValue(supabase as unknown as ReturnType<typeof createAdminClient>)

    const builder = forTable('generations')
    builder.order = vi.fn().mockResolvedValue({ data: generations, error: null })

    const result = await getSessionHistory('session-1')

    expect(result).toEqual(generations)
    expect(result).toHaveLength(2)
    expect(supabase.from).toHaveBeenCalledWith('generations')
  })

  it('returns an empty array when there is no history', async () => {
    const { supabase, forTable } = createMockSupabase()
    vi.mocked(createAdminClient).mockReturnValue(supabase as unknown as ReturnType<typeof createAdminClient>)

    const builder = forTable('generations')
    builder.order = vi.fn().mockResolvedValue({ data: [], error: null })

    const result = await getSessionHistory('session-1')

    expect(result).toEqual([])
  })

  it('throws on DB error', async () => {
    const { supabase, forTable } = createMockSupabase()
    vi.mocked(createAdminClient).mockReturnValue(supabase as unknown as ReturnType<typeof createAdminClient>)

    const builder = forTable('generations')
    builder.order = vi.fn().mockResolvedValue({ data: null, error: { message: 'db error' } })

    await expect(getSessionHistory('session-1')).rejects.toThrow(
      'Failed to fetch session history: db error'
    )
  })
})

describe('getSessionHistoryForActor', () => {
  it('queries by session and user ownership when userId is present', async () => {
    const generations = [makeGeneration({ id: 'gen-user', user_id: 'user-1' })]
    const { supabase, forTable } = createMockSupabase()
    vi.mocked(createAdminClient).mockReturnValue(supabase as unknown as ReturnType<typeof createAdminClient>)

    const builder = forTable('generations')
    builder.or = vi.fn().mockResolvedValue({ data: generations, error: null })

    const result = await getSessionHistoryForActor('session-1', 'user-1')

    expect(result).toEqual(generations)
    expect(builder.or).toHaveBeenCalledWith('session_id.eq.session-1,user_id.eq.user-1')
  })
})

// =========================================================================
// getStylePreviewCount
// =========================================================================

describe('getStylePreviewCount', () => {
  it('returns the count of style previews', async () => {
    const { supabase, forTable } = createMockSupabase()
    vi.mocked(createAdminClient).mockReturnValue(supabase as unknown as ReturnType<typeof createAdminClient>)

    // select('*', { count: 'exact', head: true }) -> eq -> resolves { count, error }
    const builder = forTable('style_previews')
    builder.select = vi.fn().mockReturnValue(builder)
    builder.eq = vi.fn().mockResolvedValue({ count: 5, error: null })

    const result = await getStylePreviewCount('gen-1')

    expect(result).toBe(5)
    expect(supabase.from).toHaveBeenCalledWith('style_previews')
  })

  it('returns 0 on error', async () => {
    const { supabase, forTable } = createMockSupabase()
    vi.mocked(createAdminClient).mockReturnValue(supabase as unknown as ReturnType<typeof createAdminClient>)

    const builder = forTable('style_previews')
    builder.select = vi.fn().mockReturnValue(builder)
    builder.eq = vi.fn().mockResolvedValue({ count: null, error: { message: 'fail' } })

    const result = await getStylePreviewCount('gen-1')

    expect(result).toBe(0)
  })

  it('returns 0 when count is null (no error)', async () => {
    const { supabase, forTable } = createMockSupabase()
    vi.mocked(createAdminClient).mockReturnValue(supabase as unknown as ReturnType<typeof createAdminClient>)

    const builder = forTable('style_previews')
    builder.select = vi.fn().mockReturnValue(builder)
    builder.eq = vi.fn().mockResolvedValue({ count: null, error: null })

    const result = await getStylePreviewCount('gen-1')

    expect(result).toBe(0)
  })
})

// =========================================================================
// touchSession
// =========================================================================

describe('touchSession', () => {
  it('calls update with last_active_at on the sessions table', async () => {
    const { supabase, forTable } = createMockSupabase()
    vi.mocked(createAdminClient).mockReturnValue(supabase as unknown as ReturnType<typeof createAdminClient>)

    const builder = forTable('sessions')
    builder.eq = vi.fn().mockResolvedValue({ data: null, error: null })

    await touchSession('session-1')

    expect(supabase.from).toHaveBeenCalledWith('sessions')
    expect(builder.update).toHaveBeenCalledWith(
      expect.objectContaining({ last_active_at: expect.any(String) })
    )
    expect(builder.eq).toHaveBeenCalledWith('id', 'session-1')
  })
})
