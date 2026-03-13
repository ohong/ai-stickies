import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useGeneration } from '@/src/hooks/use-generation'
import type { GeneratedPreview } from '@/src/hooks/use-generation'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

const samplePreviews: GeneratedPreview[] = [
  {
    id: 'preview-1',
    styleName: 'High Fidelity',
    fidelityLevel: 'high',
    description: 'A realistic sticker',
    previewUrl: 'https://example.com/preview1.png',
  },
  {
    id: 'preview-2',
    styleName: 'Chibi',
    fidelityLevel: 'chibi',
    description: 'A cute chibi sticker',
    previewUrl: 'https://example.com/preview2.png',
  },
]

function mockGenerateResponse() {
  return new Response(
    JSON.stringify({
      generationId: 'gen-abc',
      previews: samplePreviews,
      remainingGenerations: 8,
    }),
    { status: 200 }
  )
}

describe('useGeneration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts with default state', () => {
    const { result } = renderHook(() => useGeneration())

    expect(result.current.isGenerating).toBe(false)
    expect(result.current.generationId).toBeNull()
    expect(result.current.previews).toEqual([])
    expect(result.current.error).toBeNull()
    expect(result.current.progress).toBe(0)
    expect(result.current.currentStyle).toBeNull()
  })

  it('successful generation returns previews', async () => {
    mockFetch.mockResolvedValueOnce(mockGenerateResponse())

    const { result } = renderHook(() => useGeneration())

    let response: unknown
    await act(async () => {
      response = await result.current.generatePreviews('upload-123', {
        language: 'en',
      })
    })

    expect(result.current.isGenerating).toBe(false)
    expect(result.current.generationId).toBe('gen-abc')
    expect(result.current.previews).toEqual(samplePreviews)
    expect(result.current.error).toBeNull()
    expect(result.current.progress).toBe(100)
    expect(result.current.currentStyle).toBeNull()

    // Verify returned data
    expect(response).toEqual({
      generationId: 'gen-abc',
      previews: samplePreviews,
      remainingGenerations: 8,
    })

    // Verify fetch call
    expect(mockFetch).toHaveBeenCalledWith('/api/generate/previews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uploadId: 'upload-123', language: 'en' }),
    })
  })

  it('passes all options to the API', async () => {
    mockFetch.mockResolvedValueOnce(mockGenerateResponse())

    const { result } = renderHook(() => useGeneration())

    await act(async () => {
      await result.current.generatePreviews('upload-123', {
        language: 'ja',
        provider: 'fal',
        styleDescription: 'kawaii',
        personalContext: 'for my cat',
      })
    })

    const fetchBody = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(fetchBody).toEqual({
      uploadId: 'upload-123',
      language: 'ja',
      provider: 'fal',
      styleDescription: 'kawaii',
      personalContext: 'for my cat',
    })
  })

  it('handles API error and sets error state', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Model unavailable' }), {
        status: 503,
        statusText: 'Service Unavailable',
      })
    )

    const { result } = renderHook(() => useGeneration())

    let response: unknown
    await act(async () => {
      response = await result.current.generatePreviews('upload-123', {
        language: 'en',
      })
    })

    expect(response).toBeNull()
    expect(result.current.isGenerating).toBe(false)
    expect(result.current.error).toBe('Model unavailable')
    expect(result.current.progress).toBe(0)
    expect(result.current.currentStyle).toBeNull()
  })

  it('handles network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Connection refused'))

    const { result } = renderHook(() => useGeneration())

    let response: unknown
    await act(async () => {
      response = await result.current.generatePreviews('upload-123', {
        language: 'en',
      })
    })

    expect(response).toBeNull()
    expect(result.current.error).toBe('Connection refused')
    expect(result.current.isGenerating).toBe(false)
  })

  it('reset() clears all state', async () => {
    mockFetch.mockResolvedValueOnce(mockGenerateResponse())

    const { result } = renderHook(() => useGeneration())

    await act(async () => {
      await result.current.generatePreviews('upload-123', { language: 'en' })
    })

    expect(result.current.generationId).toBe('gen-abc')
    expect(result.current.previews).toHaveLength(2)

    act(() => {
      result.current.reset()
    })

    expect(result.current.isGenerating).toBe(false)
    expect(result.current.generationId).toBeNull()
    expect(result.current.previews).toEqual([])
    expect(result.current.error).toBeNull()
    expect(result.current.progress).toBe(0)
    expect(result.current.currentStyle).toBeNull()
  })

  it('clearError() only clears error', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Some error' }), {
        status: 500,
        statusText: 'Internal Server Error',
      })
    )

    const { result } = renderHook(() => useGeneration())

    await act(async () => {
      await result.current.generatePreviews('upload-123', { language: 'en' })
    })

    expect(result.current.error).toBe('Some error')

    act(() => {
      result.current.clearError()
    })

    expect(result.current.error).toBeNull()
    // Other state should remain
    expect(result.current.isGenerating).toBe(false)
  })
})
