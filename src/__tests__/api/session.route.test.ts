import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks — must be declared before the route handler import
// ---------------------------------------------------------------------------

vi.mock('@/src/lib/services/session.service', () => ({
  getOrCreateSession: vi.fn(),
  getSessionHistory: vi.fn(),
  getStylePreviewCount: vi.fn(),
}))

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------

import { GET } from '@/app/api/session/route'
import {
  getOrCreateSession,
  getSessionHistory,
  getStylePreviewCount,
} from '@/src/lib/services/session.service'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeSession(overrides: Record<string, unknown> = {}) {
  return {
    id: 'session-test-001',
    created_at: '2026-01-01T00:00:00Z',
    last_active_at: '2026-01-01T00:00:00Z',
    generation_count: 3,
    max_generations: 10,
    ...overrides,
  }
}

function makeGeneration(overrides: Record<string, unknown> = {}) {
  return {
    id: 'gen-1',
    session_id: 'session-test-001',
    upload_id: 'upload-1',
    style_description: null,
    personal_context: null,
    language: 'en',
    status: 'completed',
    provider: 'fal',
    created_at: '2026-01-01T10:00:00Z',
    completed_at: '2026-01-01T10:05:00Z',
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/session', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // -----------------------------------------------------------------------
  // Successful response
  // -----------------------------------------------------------------------

  it('returns session data with success: true', async () => {
    const session = makeSession()
    vi.mocked(getOrCreateSession).mockResolvedValue(session as any)
    vi.mocked(getSessionHistory).mockResolvedValue([])

    const response = await GET()
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data).toEqual({
      sessionId: 'session-test-001',
      generationCount: 3,
      remainingGenerations: 7,
      maxGenerations: 10,
      history: [],
    })
  })

  // -----------------------------------------------------------------------
  // Successful response with history and style counts
  // -----------------------------------------------------------------------

  it('includes history with style counts for completed generations', async () => {
    const session = makeSession({ generation_count: 2 })
    const completedGen = makeGeneration({ id: 'gen-completed', status: 'completed' })
    const pendingGen = makeGeneration({
      id: 'gen-pending',
      status: 'pending',
      completed_at: null,
    })

    vi.mocked(getOrCreateSession).mockResolvedValue(session as any)
    vi.mocked(getSessionHistory).mockResolvedValue([completedGen, pendingGen] as any)
    vi.mocked(getStylePreviewCount).mockResolvedValue(3)

    const response = await GET()
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.history).toHaveLength(2)

    // Completed generation should have styleCount
    expect(json.data.history[0]).toEqual({
      generationId: 'gen-completed',
      createdAt: '2026-01-01T10:00:00Z',
      status: 'completed',
      styleCount: 3,
    })

    // Pending generation should NOT have styleCount
    expect(json.data.history[1]).toEqual({
      generationId: 'gen-pending',
      createdAt: '2026-01-01T10:00:00Z',
      status: 'pending',
    })

    // getStylePreviewCount should only be called for completed generations
    expect(getStylePreviewCount).toHaveBeenCalledTimes(1)
    expect(getStylePreviewCount).toHaveBeenCalledWith('gen-completed')
  })

  // -----------------------------------------------------------------------
  // Correct remaining count calculation
  // -----------------------------------------------------------------------

  it('calculates remaining generations correctly', async () => {
    const session = makeSession({ generation_count: 7, max_generations: 10 })
    vi.mocked(getOrCreateSession).mockResolvedValue(session as any)
    vi.mocked(getSessionHistory).mockResolvedValue([])

    const response = await GET()
    const json = await response.json()

    expect(json.data.remainingGenerations).toBe(3)
    expect(json.data.maxGenerations).toBe(10)
  })

  // -----------------------------------------------------------------------
  // Fresh session (0 generations)
  // -----------------------------------------------------------------------

  it('returns full remaining count for a new session', async () => {
    const session = makeSession({ generation_count: 0 })
    vi.mocked(getOrCreateSession).mockResolvedValue(session as any)
    vi.mocked(getSessionHistory).mockResolvedValue([])

    const response = await GET()
    const json = await response.json()

    expect(json.data.generationCount).toBe(0)
    expect(json.data.remainingGenerations).toBe(10)
  })

  // -----------------------------------------------------------------------
  // Error: service throws
  // -----------------------------------------------------------------------

  it('returns 500 on service error with success: false', async () => {
    vi.mocked(getOrCreateSession).mockRejectedValue(
      new Error('Database connection failed')
    )

    const response = await GET()
    const json = await response.json()

    expect(response.status).toBe(500)
    expect(json.success).toBe(false)
    expect(json.error).toBe('Database connection failed')
  })

  // -----------------------------------------------------------------------
  // Error: non-Error object thrown
  // -----------------------------------------------------------------------

  it('returns generic error message for non-Error throws', async () => {
    vi.mocked(getOrCreateSession).mockRejectedValue('string error')

    const response = await GET()
    const json = await response.json()

    expect(response.status).toBe(500)
    expect(json.success).toBe(false)
    expect(json.error).toBe('Failed to get session')
  })

  // -----------------------------------------------------------------------
  // Error in getSessionHistory
  // -----------------------------------------------------------------------

  it('returns 500 when getSessionHistory fails', async () => {
    const session = makeSession()
    vi.mocked(getOrCreateSession).mockResolvedValue(session as any)
    vi.mocked(getSessionHistory).mockRejectedValue(new Error('History query failed'))

    const response = await GET()
    const json = await response.json()

    expect(response.status).toBe(500)
    expect(json.success).toBe(false)
    expect(json.error).toBe('History query failed')
  })

  // -----------------------------------------------------------------------
  // Multiple completed generations with varying style counts
  // -----------------------------------------------------------------------

  it('fetches style counts independently for each completed generation', async () => {
    const session = makeSession({ generation_count: 3 })
    const gen1 = makeGeneration({ id: 'gen-1', status: 'completed' })
    const gen2 = makeGeneration({ id: 'gen-2', status: 'completed' })
    const gen3 = makeGeneration({ id: 'gen-3', status: 'failed' })

    vi.mocked(getOrCreateSession).mockResolvedValue(session as any)
    vi.mocked(getSessionHistory).mockResolvedValue([gen1, gen2, gen3] as any)
    vi.mocked(getStylePreviewCount)
      .mockResolvedValueOnce(5) // gen-1
      .mockResolvedValueOnce(2) // gen-2

    const response = await GET()
    const json = await response.json()

    expect(json.data.history).toHaveLength(3)
    expect(json.data.history[0].styleCount).toBe(5)
    expect(json.data.history[1].styleCount).toBe(2)
    expect(json.data.history[2].styleCount).toBeUndefined()

    expect(getStylePreviewCount).toHaveBeenCalledTimes(2)
  })
})
