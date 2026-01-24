'use client'

import { useCallback } from 'react'
import type { Language, Provider } from '@/src/types/database'
import {
  generationState$,
  generationActions,
  sessionActions,
  type GeneratedPreview,
} from '@/src/lib/state'

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

export function useGeneration() {
  const generatePreviews = useCallback(
    async (
      uploadId: string,
      options: GeneratePreviewsOptions
    ): Promise<GeneratePreviewsResponse | null> => {
      generationActions.startPreviewGeneration()

      // Simulate progress updates using Legend State
      const progressInterval = setInterval(() => {
        const currentProgress = generationState$.progress.get()
        if (currentProgress >= 90) {
          clearInterval(progressInterval)
          return
        }

        const styles = ['High Fidelity', 'Stylized', 'Chibi', 'Abstract', 'Minimalist']
        const styleIndex = Math.floor(currentProgress / 20)
        generationActions.updateProgress(
          Math.min(currentProgress + 5, 90),
          styles[styleIndex] ?? 'Processing...'
        )
      }, 500)

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

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Generation failed')
        }

        const data: GeneratePreviewsResponse = await response.json()

        generationActions.setGenerationId(data.generationId)
        generationActions.addPreviews(data.previews)
        generationActions.updateProgress(100, undefined)

        // Update session (optimistic update)
        sessionActions.decrementGenerations()

        return data
      } catch (err) {
        clearInterval(progressInterval)
        const errorMessage = err instanceof Error ? err.message : 'Generation failed'
        generationActions.setError(errorMessage)
        return null
      }
    },
    []
  )

  const reset = useCallback(() => {
    generationActions.reset()
  }, [])

  const clearError = useCallback(() => {
    generationActions.setError(null)
  }, [])

  return {
    // Expose state directly from observables
    isGenerating: generationState$.isGenerating.get(),
    generationId: generationState$.generationId.get(),
    previews: generationState$.previews.get(),
    error: generationState$.error.get(),
    progress: generationState$.progress.get(),
    currentStyle: generationState$.currentStyle.get(),
    selectedStyleIds: generationState$.selectedStyleIds.get(),
    stage: generationState$.stage.get(),
    generatePreviews,
    reset,
    clearError,
  }
}
