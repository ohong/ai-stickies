import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDownload } from '@/src/hooks/use-download'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock URL object methods
const mockCreateObjectURL = vi.fn(() => 'blob:http://localhost/fake-url')
const mockRevokeObjectURL = vi.fn()
window.URL.createObjectURL = mockCreateObjectURL
window.URL.revokeObjectURL = mockRevokeObjectURL

// Track the mock anchor element created during downloads
const mockClick = vi.fn()
let lastCreatedAnchor: { href: string; download: string; click: typeof mockClick }

function mockBlobResponse() {
  const blob = new Blob(['fake-zip-content'], { type: 'application/zip' })
  return new Response(blob, { status: 200 })
}

describe('useDownload', () => {
  let createElementSpy: ReturnType<typeof vi.spyOn>
  let appendChildSpy: ReturnType<typeof vi.spyOn>
  let removeChildSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()

    const originalCreateElement = document.createElement.bind(document)
    createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName: string, options?: ElementCreationOptions) => {
      if (tagName === 'a') {
        lastCreatedAnchor = { href: '', download: '', click: mockClick }
        return lastCreatedAnchor as unknown as HTMLAnchorElement
      }
      return originalCreateElement(tagName, options)
    })

    // Only intercept appendChild/removeChild for our mock anchor elements
    const originalAppendChild = document.body.appendChild.bind(document.body)
    const originalRemoveChild = document.body.removeChild.bind(document.body)

    appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(<T extends Node>(node: T): T => {
      if (node === lastCreatedAnchor as unknown) {
        return node // Don't actually append the mock anchor
      }
      return originalAppendChild(node)
    })

    removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(<T extends Node>(node: T): T => {
      if (node === lastCreatedAnchor as unknown) {
        return node // Don't actually remove the mock anchor
      }
      return originalRemoveChild(node)
    })
  })

  afterEach(() => {
    createElementSpy.mockRestore()
    appendChildSpy.mockRestore()
    removeChildSpy.mockRestore()
  })

  it('starts with default state', () => {
    const { result } = renderHook(() => useDownload())

    expect(result.current.isDownloading).toBe(false)
    expect(result.current.downloadError).toBeNull()
    expect(result.current.currentDownload).toBeNull()
  })

  describe('downloadPack', () => {
    it('handles successful download', async () => {
      mockFetch.mockResolvedValueOnce(mockBlobResponse())

      const { result } = renderHook(() => useDownload())

      await act(async () => {
        await result.current.downloadPack('pack-123', 'Cool Stickers')
      })

      expect(result.current.isDownloading).toBe(false)
      expect(result.current.downloadError).toBeNull()
      expect(result.current.currentDownload).toBeNull()

      // Verify fetch was called with correct URL
      expect(mockFetch).toHaveBeenCalledWith('/api/packs/pack-123/download')

      // Verify blob URL creation and cleanup
      expect(mockCreateObjectURL).toHaveBeenCalled()
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/fake-url')

      // Verify download link
      expect(lastCreatedAnchor.download).toBe('cool-stickers-stickers.zip')
      expect(mockClick).toHaveBeenCalled()
    })

    it('handles API error response', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'Pack not found' }), {
          status: 404,
          statusText: 'Not Found',
        })
      )

      const { result } = renderHook(() => useDownload())

      await act(async () => {
        await result.current.downloadPack('pack-123', 'Missing Pack')
      })

      expect(result.current.isDownloading).toBe(false)
      expect(result.current.downloadError).toBe('Pack not found')
      expect(result.current.currentDownload).toBeNull()
    })

    it('shows currentDownload as pack name during download', async () => {
      let resolveDownload!: (value: Response) => void
      const downloadPromise = new Promise<Response>((resolve) => {
        resolveDownload = resolve
      })
      mockFetch.mockReturnValueOnce(downloadPromise)

      const { result } = renderHook(() => useDownload())

      let downloadDone: Promise<void>
      act(() => {
        downloadDone = result.current.downloadPack('pack-123', 'My Pack')
      })

      // During download, state should reflect in-progress
      expect(result.current.isDownloading).toBe(true)
      expect(result.current.currentDownload).toBe('My Pack')

      // Resolve the download
      await act(async () => {
        resolveDownload(mockBlobResponse())
        await downloadDone
      })

      expect(result.current.isDownloading).toBe(false)
      expect(result.current.currentDownload).toBeNull()
    })

    it('formats pack name correctly in download filename', async () => {
      mockFetch.mockResolvedValueOnce(mockBlobResponse())

      const { result } = renderHook(() => useDownload())

      await act(async () => {
        await result.current.downloadPack('pack-1', 'My  Cool   Pack')
      })

      expect(lastCreatedAnchor.download).toBe('my-cool-pack-stickers.zip')
    })
  })

  describe('downloadAll', () => {
    it('handles successful download of all packs', async () => {
      mockFetch.mockResolvedValueOnce(mockBlobResponse())

      const { result } = renderHook(() => useDownload())

      await act(async () => {
        await result.current.downloadAll('gen-abc')
      })

      expect(result.current.isDownloading).toBe(false)
      expect(result.current.downloadError).toBeNull()

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/session/download-all?generationId=gen-abc'
      )
      expect(lastCreatedAnchor.download).toBe('ai-stickies-all-packs.zip')
      expect(mockClick).toHaveBeenCalled()
    })

    it('sets currentDownload to "all packs" during download', async () => {
      let resolveDownload!: (value: Response) => void
      const downloadPromise = new Promise<Response>((resolve) => {
        resolveDownload = resolve
      })
      mockFetch.mockReturnValueOnce(downloadPromise)

      const { result } = renderHook(() => useDownload())

      let downloadDone: Promise<void>
      act(() => {
        downloadDone = result.current.downloadAll('gen-abc')
      })

      expect(result.current.currentDownload).toBe('all packs')

      await act(async () => {
        resolveDownload(mockBlobResponse())
        await downloadDone
      })
    })

    it('handles API error', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'No packs available' }), {
          status: 400,
          statusText: 'Bad Request',
        })
      )

      const { result } = renderHook(() => useDownload())

      await act(async () => {
        await result.current.downloadAll('gen-abc')
      })

      expect(result.current.downloadError).toBe('No packs available')
    })
  })

  describe('downloadSingleSticker', () => {
    it('handles successful single sticker download', async () => {
      mockFetch.mockResolvedValueOnce(mockBlobResponse())

      const { result } = renderHook(() => useDownload())

      await act(async () => {
        await result.current.downloadSingleSticker(
          'https://example.com/sticker.png',
          'Happy Face'
        )
      })

      expect(result.current.isDownloading).toBe(false)
      expect(result.current.downloadError).toBeNull()

      expect(mockFetch).toHaveBeenCalledWith('https://example.com/sticker.png')
      expect(lastCreatedAnchor.download).toBe('sticker-happy-face.png')
      expect(mockClick).toHaveBeenCalled()
    })

    it('handles fetch error for single sticker', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(null, { status: 404, statusText: 'Not Found' })
      )

      const { result } = renderHook(() => useDownload())

      await act(async () => {
        await result.current.downloadSingleSticker(
          'https://example.com/missing.png',
          'Sad'
        )
      })

      expect(result.current.downloadError).toBe('Failed to fetch sticker')
    })

    it('sets currentDownload to emotion during download', async () => {
      let resolveDownload!: (value: Response) => void
      const downloadPromise = new Promise<Response>((resolve) => {
        resolveDownload = resolve
      })
      mockFetch.mockReturnValueOnce(downloadPromise)

      const { result } = renderHook(() => useDownload())

      let downloadDone: Promise<void>
      act(() => {
        downloadDone = result.current.downloadSingleSticker(
          'https://example.com/sticker.png',
          'Excited'
        )
      })

      expect(result.current.currentDownload).toBe('Excited')

      await act(async () => {
        resolveDownload(mockBlobResponse())
        await downloadDone
      })
    })
  })

  describe('downloadMarketplaceZip', () => {
    it('handles successful marketplace export download', async () => {
      mockFetch.mockResolvedValueOnce(mockBlobResponse())

      const { result } = renderHook(() => useDownload())

      await act(async () => {
        await result.current.downloadMarketplaceZip('gen-xyz')
      })

      expect(result.current.isDownloading).toBe(false)
      expect(result.current.downloadError).toBeNull()

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/session/marketplace-export?generationId=gen-xyz'
      )
      expect(lastCreatedAnchor.download).toBe('line-marketplace-stickers.zip')
      expect(mockClick).toHaveBeenCalled()
    })

    it('handles export error', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'Export quota exceeded' }), {
          status: 429,
          statusText: 'Too Many Requests',
        })
      )

      const { result } = renderHook(() => useDownload())

      await act(async () => {
        await result.current.downloadMarketplaceZip('gen-xyz')
      })

      expect(result.current.downloadError).toBe('Export quota exceeded')
    })

    it('sets currentDownload to "marketplace package" during export', async () => {
      let resolveDownload!: (value: Response) => void
      const downloadPromise = new Promise<Response>((resolve) => {
        resolveDownload = resolve
      })
      mockFetch.mockReturnValueOnce(downloadPromise)

      const { result } = renderHook(() => useDownload())

      let downloadDone: Promise<void>
      act(() => {
        downloadDone = result.current.downloadMarketplaceZip('gen-xyz')
      })

      expect(result.current.currentDownload).toBe('marketplace package')

      await act(async () => {
        resolveDownload(mockBlobResponse())
        await downloadDone
      })
    })
  })

  describe('clearError', () => {
    it('clears error state', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'Download failed' }), {
          status: 500,
          statusText: 'Internal Server Error',
        })
      )

      const { result } = renderHook(() => useDownload())

      await act(async () => {
        await result.current.downloadPack('pack-1', 'Test')
      })

      expect(result.current.downloadError).toBe('Download failed')

      act(() => {
        result.current.clearError()
      })

      expect(result.current.downloadError).toBeNull()
      // Other state remains
      expect(result.current.isDownloading).toBe(false)
    })
  })

  describe('isDownloading', () => {
    it('is true during download', async () => {
      let resolveDownload!: (value: Response) => void
      const downloadPromise = new Promise<Response>((resolve) => {
        resolveDownload = resolve
      })
      mockFetch.mockReturnValueOnce(downloadPromise)

      const { result } = renderHook(() => useDownload())

      let downloadDone: Promise<void>
      act(() => {
        downloadDone = result.current.downloadPack('pack-1', 'Test')
      })

      expect(result.current.isDownloading).toBe(true)

      await act(async () => {
        resolveDownload(mockBlobResponse())
        await downloadDone
      })

      expect(result.current.isDownloading).toBe(false)
    })
  })

  describe('network errors', () => {
    it('handles network error in downloadPack', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useDownload())

      await act(async () => {
        await result.current.downloadPack('pack-1', 'Test')
      })

      expect(result.current.downloadError).toBe('Network error')
      expect(result.current.isDownloading).toBe(false)
    })

    it('handles network error in downloadAll', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection lost'))

      const { result } = renderHook(() => useDownload())

      await act(async () => {
        await result.current.downloadAll('gen-1')
      })

      expect(result.current.downloadError).toBe('Connection lost')
    })

    it('handles network error in downloadMarketplaceZip', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Timeout'))

      const { result } = renderHook(() => useDownload())

      await act(async () => {
        await result.current.downloadMarketplaceZip('gen-1')
      })

      expect(result.current.downloadError).toBe('Timeout')
    })
  })
})
