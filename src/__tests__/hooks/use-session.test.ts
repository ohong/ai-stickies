import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useSession } from '@/src/hooks/use-session'

// Mock session counter state
vi.mock('@/src/lib/state/session-counter', () => ({
  sessionCounterState$: {
    remaining: { set: vi.fn() },
    total: { set: vi.fn() },
  },
}))

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

function mockSessionResponse(overrides?: Record<string, unknown>) {
  const data = {
    sessionId: 'session-abc',
    generationCount: 3,
    remainingGenerations: 7,
    maxGenerations: 10,
    history: [
      {
        generationId: 'gen-1',
        createdAt: '2026-01-01T00:00:00Z',
        status: 'completed',
        styleCount: 5,
      },
    ],
    ...overrides,
  }

  return new Response(
    JSON.stringify({ success: true, data }),
    { status: 200 }
  )
}

describe('useSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches session on mount and sets state from response', async () => {
    mockFetch.mockResolvedValueOnce(mockSessionResponse())

    const { result } = renderHook(() => useSession())

    // Initially loading
    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.sessionId).toBe('session-abc')
    expect(result.current.generationCount).toBe(3)
    expect(result.current.remainingGenerations).toBe(7)
    expect(result.current.maxGenerations).toBe(10)
    expect(result.current.error).toBeNull()

    expect(mockFetch).toHaveBeenCalledWith('/api/session')
  })

  it('handles API error gracefully and sets error state', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Server unavailable' }), {
        status: 500,
        statusText: 'Internal Server Error',
      })
    )

    const { result } = renderHook(() => useSession())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe('Server unavailable')
    expect(result.current.sessionId).toBeNull()
  })

  it('handles response with success: false', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ success: false, error: 'Session expired' }),
        { status: 200 }
      )
    )

    const { result } = renderHook(() => useSession())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe('Session expired')
  })

  it('handles network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network failure'))

    const { result } = renderHook(() => useSession())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe('Network failure')
  })

  it('canGenerate is true when remaining > 0 and no error', async () => {
    mockFetch.mockResolvedValueOnce(
      mockSessionResponse({ remainingGenerations: 5 })
    )

    const { result } = renderHook(() => useSession())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.canGenerate).toBe(true)
  })

  it('canGenerate is false when remaining === 0', async () => {
    mockFetch.mockResolvedValueOnce(
      mockSessionResponse({ remainingGenerations: 0 })
    )

    const { result } = renderHook(() => useSession())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.canGenerate).toBe(false)
  })

  it('canGenerate is false when error exists', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Broken' }), {
        status: 500,
        statusText: 'Internal Server Error',
      })
    )

    const { result } = renderHook(() => useSession())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.canGenerate).toBe(false)
  })

  it('decrementGenerations updates remaining locally', async () => {
    mockFetch.mockResolvedValueOnce(
      mockSessionResponse({ remainingGenerations: 5, generationCount: 2 })
    )

    const { result } = renderHook(() => useSession())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.remainingGenerations).toBe(5)
    expect(result.current.generationCount).toBe(2)

    act(() => {
      result.current.decrementGenerations()
    })

    expect(result.current.remainingGenerations).toBe(4)
    expect(result.current.generationCount).toBe(3)
  })

  it('decrementGenerations does not go below zero', async () => {
    mockFetch.mockResolvedValueOnce(
      mockSessionResponse({ remainingGenerations: 0, generationCount: 10 })
    )

    const { result } = renderHook(() => useSession())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    act(() => {
      result.current.decrementGenerations()
    })

    expect(result.current.remainingGenerations).toBe(0)
  })

  it('refresh re-fetches session', async () => {
    mockFetch
      .mockResolvedValueOnce(
        mockSessionResponse({ remainingGenerations: 7 })
      )
      .mockResolvedValueOnce(
        mockSessionResponse({ remainingGenerations: 5 })
      )

    const { result } = renderHook(() => useSession())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.remainingGenerations).toBe(7)

    await act(async () => {
      result.current.refresh()
    })

    await waitFor(() => {
      expect(result.current.remainingGenerations).toBe(5)
    })

    expect(mockFetch).toHaveBeenCalledTimes(2)
  })
})
