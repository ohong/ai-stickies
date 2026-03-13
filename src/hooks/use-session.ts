'use client'

import { useState, useEffect, useCallback } from 'react'
import { sessionCounterState$ } from '@/src/lib/state/session-counter'
import { parseApiResponse } from '@/src/lib/utils/http'

interface GenerationHistoryItem {
  generationId: string
  createdAt: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  styleCount?: number
}

interface SessionState {
  sessionId: string | null
  generationCount: number
  remainingGenerations: number
  maxGenerations: number
  history: GenerationHistoryItem[]
  isLoading: boolean
  error: string | null
}

interface SessionResponse {
  success: boolean
  data?: {
    sessionId: string
    generationCount: number
    remainingGenerations: number
    maxGenerations: number
    history: GenerationHistoryItem[]
  }
  error?: string
}

const initialState: SessionState = {
  sessionId: null,
  generationCount: 0,
  remainingGenerations: 10,
  maxGenerations: 10,
  history: [],
  isLoading: true,
  error: null,
}

export function useSession() {
  const [state, setState] = useState<SessionState>(initialState)

  const fetchSession = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch('/api/session')
      const json = await parseApiResponse<SessionResponse>(
        response,
        'Failed to fetch session'
      )

      if (!json.success || !json.data) {
        throw new Error(json.error ?? 'Failed to fetch session')
      }

      // Update local state
      setState({
        sessionId: json.data.sessionId,
        generationCount: json.data.generationCount,
        remainingGenerations: json.data.remainingGenerations,
        maxGenerations: json.data.maxGenerations,
        history: json.data.history,
        isLoading: false,
        error: null,
      })

      // Sync with Legend State observable for SessionCounter component
      sessionCounterState$.remaining.set(json.data.remainingGenerations)
      sessionCounterState$.total.set(json.data.maxGenerations)
    } catch (err) {
      sessionCounterState$.remaining.set(0)
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      }))
    }
  }, [])

  useEffect(() => {
    fetchSession()
  }, [fetchSession])

  const refresh = useCallback(() => {
    fetchSession()
  }, [fetchSession])

  // Optimistic update for UI responsiveness
  const decrementGenerations = useCallback(() => {
    setState((prev) => {
      const newRemaining = Math.max(0, prev.remainingGenerations - 1)
      return {
        ...prev,
        generationCount: prev.generationCount + 1,
        remainingGenerations: newRemaining,
      }
    })
    // Sync with Legend State observable outside the setState updater
    // to avoid updating another component during React's render phase
    sessionCounterState$.remaining.set(
      Math.max(0, state.remainingGenerations - 1)
    )
  }, [state.remainingGenerations])

  return {
    ...state,
    refresh,
    decrementGenerations,
    canGenerate: !state.error && state.remainingGenerations > 0,
  }
}
