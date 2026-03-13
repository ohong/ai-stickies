'use client'

import { useState, useCallback } from 'react'
import type { Language, Provider, FidelityLevel } from '@/src/types/database'
import { parseApiResponse } from '@/src/lib/utils/http'

export interface GeneratedPreview {
  id: string
  styleName: string
  fidelityLevel: FidelityLevel
  description: string
  previewUrl: string
}

interface GeneratePreviewsOptions {
  styleDescription?: string
  personalContext?: string
  language: Language
  provider?: Provider
}

interface GeneratePreviewsResponse {
  generationId: string
  previews: GeneratedPreview[]
  remainingGenerations: number
}

interface GenerationState {
  isGenerating: boolean
  generationId: string | null
  previews: GeneratedPreview[]
  error: string | null
  progress: number
  currentStyle: string | null
}

export function useGeneration() {
  const [state, setState] = useState<GenerationState>({
    isGenerating: false,
    generationId: null,
    previews: [],
    error: null,
    progress: 0,
    currentStyle: null,
  })

  const generatePreviews = useCallback(
    async (
      uploadId: string,
      options: GeneratePreviewsOptions
    ): Promise<GeneratePreviewsResponse | null> => {
      setState({
        isGenerating: true,
        generationId: null,
        previews: [],
        error: null,
        progress: 0,
        currentStyle: 'Preparing...',
      })

      // Simulate progress with decelerating curve
      const progressInterval = setInterval(() => {
        setState((prev) => {
          if (prev.progress >= 95) return prev
          const styles = ['High Fidelity', 'Stylized', 'Chibi', 'Abstract', 'Minimalist']
          const styleIndex = Math.floor(prev.progress / 20)
          const increment = Math.max((95 - prev.progress) * 0.08, 0.5)
          return {
            ...prev,
            progress: Math.min(prev.progress + increment, 95),
            currentStyle: styles[styleIndex] ?? 'Processing...',
          }
        })
      }, 1000)

      try {
        const response = await fetch('/api/generate/previews', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uploadId,
            ...options,
          }),
        })

        clearInterval(progressInterval)

        const data = await parseApiResponse<GeneratePreviewsResponse>(
          response,
          'Generation failed'
        )

        setState({
          isGenerating: false,
          generationId: data.generationId,
          previews: data.previews,
          error: null,
          progress: 100,
          currentStyle: null,
        })

        return data
      } catch (err) {
        clearInterval(progressInterval)
        const errorMessage = err instanceof Error ? err.message : 'Generation failed'
        setState((prev) => ({
          ...prev,
          isGenerating: false,
          error: errorMessage,
          progress: 0,
          currentStyle: null,
        }))
        return null
      }
    },
    []
  )

  const reset = useCallback(() => {
    setState({
      isGenerating: false,
      generationId: null,
      previews: [],
      error: null,
      progress: 0,
      currentStyle: null,
    })
  }, [])

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }))
  }, [])

  return {
    ...state,
    generatePreviews,
    reset,
    clearError,
  }
}
