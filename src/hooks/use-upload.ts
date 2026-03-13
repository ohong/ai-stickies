'use client'

import { useState, useCallback } from 'react'
import { storageConfig } from '@/src/lib/config'
import { createClient } from '@/src/lib/supabase/client'
import { parseApiResponse } from '@/src/lib/utils/http'

interface UploadedImage {
  id: string
  url: string
  filename: string
  size: number
}

interface UploadState {
  uploadedImage: UploadedImage | null
  uploadProgress: number
  isUploading: boolean
  error: string | null
}

interface UploadResponse {
  uploadId: string
  previewUrl: string
  sessionId: string
  remainingGenerations: number
}

interface InitiateUploadResponse {
  sessionId: string
  remainingGenerations: number
  signedUrl: string
  storagePath: string
  token: string
}

export function useUpload() {
  const [state, setState] = useState<UploadState>({
    uploadedImage: null,
    uploadProgress: 0,
    isUploading: false,
    error: null,
  })

  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    if (!storageConfig.allowedMimeTypes.includes(file.type)) {
      return 'Please upload a JPG, PNG, or WebP image'
    }

    // Check file size (convert MB to bytes)
    const maxSizeBytes = storageConfig.maxUploadSizeMb * 1024 * 1024
    if (file.size > maxSizeBytes) {
      return `File size must be less than ${storageConfig.maxUploadSizeMb}MB`
    }

    return null
  }, [])

  const uploadFile = useCallback(async (file: File): Promise<boolean> => {
    let progressInterval: ReturnType<typeof setInterval> | null = null

    // Validate file first
    const validationError = validateFile(file)
    if (validationError) {
      setState(prev => ({ ...prev, error: validationError }))
      return false
    }

    setState({
      uploadedImage: null,
      uploadProgress: 0,
      isUploading: true,
      error: null,
    })

    try {
      progressInterval = setInterval(() => {
        setState(prev => ({
          ...prev,
          uploadProgress: Math.min(prev.uploadProgress + 10, 90),
        }))
      }, 100)

      const initResponse = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'initiate',
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
        }),
      })

      const initData = await parseApiResponse<InitiateUploadResponse>(
        initResponse,
        'Upload failed'
      )

      const supabase = createClient()
      const { error: uploadError } = await supabase.storage
        .from(storageConfig.uploadBucket)
        .uploadToSignedUrl(initData.storagePath, initData.token, file, {
          cacheControl: '3600',
          contentType: file.type,
        })

      if (uploadError) {
        throw new Error(uploadError.message || 'Upload failed')
      }

      const completeResponse = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'complete',
          storagePath: initData.storagePath,
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
        }),
      })

      const data = await parseApiResponse<UploadResponse>(
        completeResponse,
        'Upload failed'
      )

      setState({
        uploadedImage: {
          id: data.uploadId,
          url: data.previewUrl,
          filename: file.name,
          size: file.size,
        },
        uploadProgress: 100,
        isUploading: false,
        error: null,
      })

      return true
    } catch (err) {
      setState(prev => ({
        ...prev,
        uploadProgress: 0,
        isUploading: false,
        error: err instanceof Error ? err.message : 'Upload failed',
      }))
      return false
    } finally {
      if (progressInterval) {
        clearInterval(progressInterval)
      }
    }
  }, [validateFile])

  const clearUpload = useCallback(() => {
    setState({
      uploadedImage: null,
      uploadProgress: 0,
      isUploading: false,
      error: null,
    })
  }, [])

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  return {
    ...state,
    uploadFile,
    clearUpload,
    clearError,
  }
}
