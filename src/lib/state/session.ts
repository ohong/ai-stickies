import { observable, computed } from '@legendapp/state'

export interface GenerationHistoryItem {
  generationId: string
  createdAt: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  styleCount?: number
}

export const sessionState$ = observable({
  sessionId: '',
  generationCount: 0,
  remainingGenerations: 10,
  maxGenerations: 10,
  history: [] as GenerationHistoryItem[],
  isLoading: true,
  error: null as string | null,
})

// Computed: Can user generate more stickers?
export const canGenerate$ = computed(() => sessionState$.remainingGenerations.get() > 0)

// Computed: Generation progress percentage
export const generationProgressPercentage$ = computed(() => {
  const count = sessionState$.generationCount.get()
  const max = sessionState$.maxGenerations.get()
  return max > 0 ? Math.round((count / max) * 100) : 0
})

// Computed: Is session expired (more than 24h since last activity)
export const isSessionExpired$ = computed(() => {
  // This would be computed from last_active_at when we track it
  return false
})

// Actions
export const sessionActions = {
  setSession: (data: {
    sessionId: string
    generationCount: number
    remainingGenerations: number
    maxGenerations: number
    history: GenerationHistoryItem[]
  }) => {
    sessionState$.sessionId.set(data.sessionId)
    sessionState$.generationCount.set(data.generationCount)
    sessionState$.remainingGenerations.set(data.remainingGenerations)
    sessionState$.maxGenerations.set(data.maxGenerations)
    sessionState$.history.set(data.history)
    sessionState$.isLoading.set(false)
    sessionState$.error.set(null)
  },

  setLoading: (isLoading: boolean) => {
    sessionState$.isLoading.set(isLoading)
  },

  setError: (error: string | null) => {
    sessionState$.error.set(error)
  },

  decrementGenerations: () => {
    sessionState$.generationCount.set((prev: number) => prev + 1)
    sessionState$.remainingGenerations.set((prev: number) => Math.max(0, prev - 1))
  },

  addToHistory: (item: GenerationHistoryItem) => {
    sessionState$.history.push(item)
  },

  reset: () => {
    sessionState$.sessionId.set('')
    sessionState$.generationCount.set(0)
    sessionState$.remainingGenerations.set(10)
    sessionState$.maxGenerations.set(10)
    sessionState$.history.set([])
    sessionState$.isLoading.set(false)
    sessionState$.error.set(null)
  },
}