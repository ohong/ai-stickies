'use client'

import { useState, useCallback } from 'react'

interface DownloadState {
  isDownloading: boolean
  downloadError: string | null
  currentDownload: string | null
}

export function useDownload() {
  const [state, setState] = useState<DownloadState>({
    isDownloading: false,
    downloadError: null,
    currentDownload: null,
  })

  const downloadPack = useCallback(async (packId: string, packName: string) => {
    setState({ isDownloading: true, downloadError: null, currentDownload: packName })

    try {
      const response = await fetch(`/api/packs/${packId}/download`)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Download failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${packName.replace(/\s+/g, '-').toLowerCase()}-stickers.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setState({ isDownloading: false, downloadError: null, currentDownload: null })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Download failed'
      setState({ isDownloading: false, downloadError: message, currentDownload: null })
    }
  }, [])

  const downloadAll = useCallback(async (generationId: string) => {
    setState({ isDownloading: true, downloadError: null, currentDownload: 'all packs' })

    try {
      const response = await fetch(`/api/session/download-all?generationId=${generationId}`)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Download failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ai-stickies-all-packs.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setState({ isDownloading: false, downloadError: null, currentDownload: null })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Download failed'
      setState({ isDownloading: false, downloadError: message, currentDownload: null })
    }
  }, [])

  const downloadSingleSticker = useCallback(async (imageUrl: string, emotion: string) => {
    setState({ isDownloading: true, downloadError: null, currentDownload: emotion })

    try {
      const response = await fetch(imageUrl)
      if (!response.ok) throw new Error('Failed to fetch sticker')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sticker-${emotion.replace(/\s+/g, '-').toLowerCase()}.png`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setState({ isDownloading: false, downloadError: null, currentDownload: null })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Download failed'
      setState({ isDownloading: false, downloadError: message, currentDownload: null })
    }
  }, [])

  const downloadMarketplaceZip = useCallback(async (generationId: string) => {
    setState({ isDownloading: true, downloadError: null, currentDownload: 'marketplace package' })

    try {
      const response = await fetch(`/api/session/marketplace-export?generationId=${generationId}`)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Export failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `line-marketplace-stickers.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setState({ isDownloading: false, downloadError: null, currentDownload: null })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Export failed'
      setState({ isDownloading: false, downloadError: message, currentDownload: null })
    }
  }, [])

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, downloadError: null }))
  }, [])

  return {
    ...state,
    downloadPack,
    downloadAll,
    downloadSingleSticker,
    downloadMarketplaceZip,
    clearError,
  }
}
