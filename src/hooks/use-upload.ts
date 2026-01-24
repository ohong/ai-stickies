'use client'

import { useState, useCallback } from 'react'
import { storageConfig } from '@/src/lib/config'

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
      // Create form data
      const formData = new FormData()
      formData.append('file', file)

      // Simulate progress updates (XHR for real progress tracking)
      const progressInterval = setInterval(() => {
        setState(prev => ({
          ...prev,
          uploadProgress: Math.min(prev.uploadProgress + 10, 90),
        }))
      }, 100)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const data: UploadResponse = await response.json()

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
