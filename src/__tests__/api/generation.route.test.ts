import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ---------------------------------------------------------------------------
// Mocks — must be declared before the route handler import
// ---------------------------------------------------------------------------

vi.mock('@/src/lib/services/session.service', () => ({
  getSessionIdFromCookie: vi.fn(),
}))

vi.mock('@/src/lib/services/generation.service', () => ({
  getGenerationWithPreviews: vi.fn(),
}))

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------

import { GET } from '@/app/api/generations/[generationId]/route'
import { getSessionIdFromCookie } from '@/src/lib/services/session.service'
import { getGenerationWithPreviews } from '@/src/lib/services/generation.service'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createRequest(generationId: string): NextRequest {
  return new NextRequest(
    `http://localhost:3000/api/generations/${generationId}`
  )
}

/**
 * The Next.js route handler for dynamic routes receives params as a Promise.
 * We simulate this by passing { params: Promise.resolve({ generationId }) }.
 */
function createParams(generationId: string) {
  return { params: Promise.resolve({ generationId }) }
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const TEST_SESSION_ID = 'session-owner-123'
const TEST_GENERATION_ID = 'gen-abc-456'

function makeGeneration(overrides: Record<string, unknown> = {}) {
  return {
    id: TEST_GENERATION_ID,
    session_id: TEST_SESSION_ID,
    upload_id: 'upload-1',
    style_description: 'cartoon style',
    personal_context: null,
    language: 'en',
    status: 'completed',
    provider: 'fal',
    created_at: '2026-01-15T10:00:00Z',
    completed_at: '2026-01-15T10:05:00Z',
    ...overrides,
  }
}

const mockPreviews = [
  {
    id: 'preview-1',
    styleName: 'Chibi',
    fidelityLevel: 'chibi',
    description: 'Cute chibi style',
    previewUrl: 'https://example.com/previews/chibi.png',
  },
  {
    id: 'preview-2',
    styleName: 'Minimalist',
    fidelityLevel: 'minimalist',
    description: 'Clean minimalist style',
    previewUrl: 'https://example.com/previews/minimalist.png',
  },
]

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/generations/[generationId]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // -----------------------------------------------------------------------
  // 401 — no session cookie
  // -----------------------------------------------------------------------

  it('returns 401 when no session cookie', async () => {
    vi.mocked(getSessionIdFromCookie).mockResolvedValue(null)

    const request = createRequest(TEST_GENERATION_ID)
    const response = await GET(request, createParams(TEST_GENERATION_ID))
    const json = await response.json()

    expect(response.status).toBe(401)
    expect(json.error).toBe('No session found')
    expect(getGenerationWithPreviews).not.toHaveBeenCalled()
  })

  // -----------------------------------------------------------------------
  // 404 — generation not found
  // -----------------------------------------------------------------------

  it('returns 404 when generation not found', async () => {
    vi.mocked(getSessionIdFromCookie).mockResolvedValue(TEST_SESSION_ID)
    vi.mocked(getGenerationWithPreviews).mockResolvedValue(null)

    const request = createRequest('nonexistent-gen')
    const response = await GET(request, createParams('nonexistent-gen'))
    const json = await response.json()

    expect(response.status).toBe(404)
    expect(json.error).toBe('Generation not found')
  })

  // -----------------------------------------------------------------------
  // 403 — generation belongs to different session
  // -----------------------------------------------------------------------

  it('returns 403 when generation belongs to different session', async () => {
    vi.mocked(getSessionIdFromCookie).mockResolvedValue('different-session-id')
    vi.mocked(getGenerationWithPreviews).mockResolvedValue({
      generation: makeGeneration({ session_id: TEST_SESSION_ID }),
      previews: mockPreviews,
    } as any)

    const request = createRequest(TEST_GENERATION_ID)
    const response = await GET(request, createParams(TEST_GENERATION_ID))
    const json = await response.json()

    expect(response.status).toBe(403)
    expect(json.error).toBe('Access denied')
  })

  // -----------------------------------------------------------------------
  // 200 — success with previews
  // -----------------------------------------------------------------------

  it('returns generation data with previews on success', async () => {
    vi.mocked(getSessionIdFromCookie).mockResolvedValue(TEST_SESSION_ID)
    vi.mocked(getGenerationWithPreviews).mockResolvedValue({
      generation: makeGeneration(),
      previews: mockPreviews,
    } as any)

    const request = createRequest(TEST_GENERATION_ID)
    const response = await GET(request, createParams(TEST_GENERATION_ID))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.generation).toEqual({
      id: TEST_GENERATION_ID,
      status: 'completed',
      language: 'en',
      createdAt: '2026-01-15T10:00:00Z',
    })
    expect(json.previews).toEqual(mockPreviews)
    expect(json.previews).toHaveLength(2)
  })

  // -----------------------------------------------------------------------
  // Response shape — only includes expected fields
  // -----------------------------------------------------------------------

  it('only exposes allowed generation fields (no session_id leak)', async () => {
    vi.mocked(getSessionIdFromCookie).mockResolvedValue(TEST_SESSION_ID)
    vi.mocked(getGenerationWithPreviews).mockResolvedValue({
      generation: makeGeneration(),
      previews: [],
    } as any)

    const request = createRequest(TEST_GENERATION_ID)
    const response = await GET(request, createParams(TEST_GENERATION_ID))
    const json = await response.json()

    // The response should NOT include internal fields
    expect(json.generation).not.toHaveProperty('session_id')
    expect(json.generation).not.toHaveProperty('upload_id')
    expect(json.generation).not.toHaveProperty('provider')

    // Should include public fields
    expect(json.generation).toHaveProperty('id')
    expect(json.generation).toHaveProperty('status')
    expect(json.generation).toHaveProperty('language')
    expect(json.generation).toHaveProperty('createdAt')
  })

  // -----------------------------------------------------------------------
  // 500 — unexpected error
  // -----------------------------------------------------------------------

  it('returns 500 when service throws unexpected error', async () => {
    vi.mocked(getSessionIdFromCookie).mockResolvedValue(TEST_SESSION_ID)
    vi.mocked(getGenerationWithPreviews).mockRejectedValue(
      new Error('Database connection error')
    )

    const request = createRequest(TEST_GENERATION_ID)
    const response = await GET(request, createParams(TEST_GENERATION_ID))
    const json = await response.json()

    expect(response.status).toBe(500)
    expect(json.error).toBe('Failed to fetch generation')
  })

  // -----------------------------------------------------------------------
  // Correct generationId is passed to service
  // -----------------------------------------------------------------------

  it('passes correct generationId from URL params to service', async () => {
    const specificId = 'specific-gen-id-789'
    vi.mocked(getSessionIdFromCookie).mockResolvedValue(TEST_SESSION_ID)
    vi.mocked(getGenerationWithPreviews).mockResolvedValue(null)

    const request = createRequest(specificId)
    await GET(request, createParams(specificId))

    expect(getGenerationWithPreviews).toHaveBeenCalledWith(specificId)
  })

  // -----------------------------------------------------------------------
  // Empty previews array
  // -----------------------------------------------------------------------

  it('returns generation with empty previews array', async () => {
    vi.mocked(getSessionIdFromCookie).mockResolvedValue(TEST_SESSION_ID)
    vi.mocked(getGenerationWithPreviews).mockResolvedValue({
      generation: makeGeneration({ status: 'processing' }),
      previews: [],
    } as any)

    const request = createRequest(TEST_GENERATION_ID)
    const response = await GET(request, createParams(TEST_GENERATION_ID))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.generation.status).toBe('processing')
    expect(json.previews).toEqual([])
  })
})
