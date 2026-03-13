import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useUpload } from '@/src/hooks/use-upload'

// Mock config
vi.mock('@/src/lib/config', () => ({
  storageConfig: {
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxUploadSizeMb: 10,
    uploadBucket: 'uploads',
  },
}))

// Mock supabase client
const mockUploadToSignedUrl = vi.fn()
vi.mock('@/src/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    storage: {
      from: vi.fn(() => ({
        uploadToSignedUrl: mockUploadToSignedUrl,
      })),
    },
  })),
}))

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

function createFile(
  name: string,
  size: number,
  type: string
): File {
  const buffer = new ArrayBuffer(size)
  return new File([buffer], name, { type })
}

function mockInitiateResponse() {
  return new Response(
    JSON.stringify({
      sessionId: 'session-1',
      remainingGenerations: 9,
      signedUrl: 'https://supabase.co/signed-url',
      storagePath: 'uploads/test.png',
      token: 'upload-token-123',
    }),
    { status: 200 }
  )
}

function mockCompleteResponse() {
  return new Response(
    JSON.stringify({
      uploadId: 'upload-123',
      previewUrl: 'https://supabase.co/preview/test.png',
      sessionId: 'session-1',
      remainingGenerations: 9,
    }),
    { status: 200 }
  )
}

describe('useUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts with default state', () => {
    const { result } = renderHook(() => useUpload())

    expect(result.current.uploadedImage).toBeNull()
    expect(result.current.uploadProgress).toBe(0)
    expect(result.current.isUploading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('rejects invalid file type', async () => {
    const { result } = renderHook(() => useUpload())
    const file = createFile('test.gif', 1024, 'image/gif')

    let success: boolean
    await act(async () => {
      success = await result.current.uploadFile(file)
    })

    expect(success!).toBe(false)
    expect(result.current.error).toBe('Please upload a JPG, PNG, or WebP image')
    expect(result.current.isUploading).toBe(false)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('rejects file exceeding size limit', async () => {
    const { result } = renderHook(() => useUpload())
    const oversizeFile = createFile('large.png', 11 * 1024 * 1024, 'image/png')

    let success: boolean
    await act(async () => {
      success = await result.current.uploadFile(oversizeFile)
    })

    expect(success!).toBe(false)
    expect(result.current.error).toBe('File size must be less than 10MB')
    expect(result.current.isUploading).toBe(false)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('accepts file at exactly size limit', async () => {
    const { result } = renderHook(() => useUpload())
    const exactFile = createFile('exact.png', 10 * 1024 * 1024, 'image/png')

    mockFetch
      .mockResolvedValueOnce(mockInitiateResponse())
      .mockResolvedValueOnce(mockCompleteResponse())
    mockUploadToSignedUrl.mockResolvedValueOnce({ error: null })

    await act(async () => {
      await result.current.uploadFile(exactFile)
    })

    // Should not have an error since exact limit is allowed
    expect(result.current.error).toBeNull()
  })

  it('successful upload flow (initiate -> upload -> complete)', async () => {
    const { result } = renderHook(() => useUpload())
    const file = createFile('photo.png', 5000, 'image/png')

    mockFetch
      .mockResolvedValueOnce(mockInitiateResponse())
      .mockResolvedValueOnce(mockCompleteResponse())
    mockUploadToSignedUrl.mockResolvedValueOnce({ error: null })

    let success: boolean
    await act(async () => {
      success = await result.current.uploadFile(file)
    })

    expect(success!).toBe(true)
    expect(result.current.isUploading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.uploadProgress).toBe(100)
    expect(result.current.uploadedImage).toEqual({
      id: 'upload-123',
      url: 'https://supabase.co/preview/test.png',
      filename: 'photo.png',
      size: 5000,
    })

    // Verify initiate call
    expect(mockFetch).toHaveBeenCalledTimes(2)
    const initiateCall = mockFetch.mock.calls[0]
    expect(initiateCall[0]).toBe('/api/upload')
    expect(JSON.parse(initiateCall[1].body)).toEqual({
      action: 'initiate',
      fileName: 'photo.png',
      mimeType: 'image/png',
      fileSize: 5000,
    })

    // Verify complete call
    const completeCall = mockFetch.mock.calls[1]
    expect(completeCall[0]).toBe('/api/upload')
    expect(JSON.parse(completeCall[1].body)).toEqual({
      action: 'complete',
      storagePath: 'uploads/test.png',
      fileName: 'photo.png',
      mimeType: 'image/png',
      fileSize: 5000,
    })

    // Verify supabase upload
    expect(mockUploadToSignedUrl).toHaveBeenCalledWith(
      'uploads/test.png',
      'upload-token-123',
      file,
      { cacheControl: '3600', contentType: 'image/png' }
    )
  })

  it('handles API error on initiate', async () => {
    const { result } = renderHook(() => useUpload())
    const file = createFile('photo.png', 5000, 'image/png')

    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429,
        statusText: 'Too Many Requests',
      })
    )

    let success: boolean
    await act(async () => {
      success = await result.current.uploadFile(file)
    })

    expect(success!).toBe(false)
    expect(result.current.isUploading).toBe(false)
    expect(result.current.error).toBe('Rate limit exceeded')
    expect(result.current.uploadProgress).toBe(0)
  })

  it('handles Supabase upload error', async () => {
    const { result } = renderHook(() => useUpload())
    const file = createFile('photo.png', 5000, 'image/png')

    mockFetch.mockResolvedValueOnce(mockInitiateResponse())
    mockUploadToSignedUrl.mockResolvedValueOnce({
      error: { message: 'Storage quota exceeded' },
    })

    let success: boolean
    await act(async () => {
      success = await result.current.uploadFile(file)
    })

    expect(success!).toBe(false)
    expect(result.current.isUploading).toBe(false)
    expect(result.current.error).toBe('Storage quota exceeded')
    expect(result.current.uploadProgress).toBe(0)
    // Should not call complete
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('handles API error on complete', async () => {
    const { result } = renderHook(() => useUpload())
    const file = createFile('photo.png', 5000, 'image/png')

    mockFetch
      .mockResolvedValueOnce(mockInitiateResponse())
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'Processing failed' }), {
          status: 500,
          statusText: 'Internal Server Error',
        })
      )
    mockUploadToSignedUrl.mockResolvedValueOnce({ error: null })

    let success: boolean
    await act(async () => {
      success = await result.current.uploadFile(file)
    })

    expect(success!).toBe(false)
    expect(result.current.isUploading).toBe(false)
    expect(result.current.error).toBe('Processing failed')
  })

  it('clearUpload resets all state', async () => {
    const { result } = renderHook(() => useUpload())
    const file = createFile('photo.png', 5000, 'image/png')

    mockFetch
      .mockResolvedValueOnce(mockInitiateResponse())
      .mockResolvedValueOnce(mockCompleteResponse())
    mockUploadToSignedUrl.mockResolvedValueOnce({ error: null })

    await act(async () => {
      await result.current.uploadFile(file)
    })

    expect(result.current.uploadedImage).not.toBeNull()

    act(() => {
      result.current.clearUpload()
    })

    expect(result.current.uploadedImage).toBeNull()
    expect(result.current.uploadProgress).toBe(0)
    expect(result.current.isUploading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('clearError only clears error', async () => {
    const { result } = renderHook(() => useUpload())
    const file = createFile('photo.gif', 5000, 'image/gif')

    await act(async () => {
      await result.current.uploadFile(file)
    })

    expect(result.current.error).toBe('Please upload a JPG, PNG, or WebP image')

    act(() => {
      result.current.clearError()
    })

    expect(result.current.error).toBeNull()
    // Other state should remain unchanged
    expect(result.current.isUploading).toBe(false)
  })

  it('handles network error during fetch', async () => {
    const { result } = renderHook(() => useUpload())
    const file = createFile('photo.png', 5000, 'image/png')

    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    let success: boolean
    await act(async () => {
      success = await result.current.uploadFile(file)
    })

    expect(success!).toBe(false)
    expect(result.current.isUploading).toBe(false)
    expect(result.current.error).toBe('Network error')
  })
})
