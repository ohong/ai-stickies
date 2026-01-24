import { observable, computed } from '@legendapp/state'
import type { FidelityLevel } from '@/src/types/database'

export interface GeneratedPreview {
  id: string
  styleName: string
  fidelityLevel: FidelityLevel
  description: string
  previewUrl: string
}

export interface GeneratedPack {
  id: string
  generationId: string
  styleName: string
  stickerCount: number
  downloadUrl: string
  status: 'completed' | 'partial' | 'failed'
}

export const generationState$ = observable({
  isGenerating: false,
  generationId: '',
  previews: [] as GeneratedPreview[],
  packs: [] as GeneratedPack[],
  error: null as string | null,
  progress: 0,
  currentStyle: null as string | null,
  selectedStyleIds: [] as string[],
  stage: 'idle' as 'idle' | 'preview' | 'pack',
})

// Computed: Progress percentage for UI
export const progressPercentage$ = computed(() => {
  return Math.round(generationState$.progress.get())
})

// Computed: Current style index (1-5 for previews)
export const currentStyleIndex$ = computed(() => {
  const progress = generationState$.progress.get()
  return Math.min(Math.floor((progress / 100) * 5) + 1, 5)
})

// Computed: Is preview generation complete
export const isPreviewComplete$ = computed(() => {
  return generationState$.previews.length.get() >= 5
})

// Computed: Selected preview count
export const selectedCount$ = computed(() => {
  return generationState$.selectedStyleIds.length.get()
})

// Computed: Can proceed to pack generation
export const canGeneratePacks$ = computed(() => {
  return generationState$.selectedStyleIds.length.get() > 0
})

// Computed: Total stickers being generated
export const totalStickersToGenerate$ = computed(() => {
  return generationState$.selectedStyleIds.length.get() * 10
})

// Computed: Estimated completion time (seconds)
export const estimatedTimeRemaining$ = computed(() => {
  const progress = generationState$.progress.get()
  const selected = generationState$.selectedStyleIds.length.get()
  
  if (progress === 0 || selected === 0) return 0
  
  // Rough estimate: 30 seconds per preview, 45 seconds per sticker pack
  const isPreview = generationState$.stage.get() === 'preview'
  const estimatedTotal = isPreview ? 150 : selected * 45
  const elapsed = estimatedTotal * (progress / 100)
  
  return Math.max(0, estimatedTotal - elapsed)
})

// Actions
export const generationActions = {
  startPreviewGeneration: () => {
    generationState$.isGenerating.set(true)
    generationState$.progress.set(0)
    generationState$.currentStyle.set('Preparing...')
    generationState$.error.set(null)
    generationState$.stage.set('preview')
  },

  updateProgress: (progress: number, currentStyle?: string) => {
    generationState$.progress.set(progress)
    if (currentStyle) {
      generationState$.currentStyle.set(currentStyle)
    }
  },

  setGenerationId: (id: string) => {
    generationState$.generationId.set(id)
  },

  addPreviews: (previews: GeneratedPreview[]) => {
    generationState$.previews.set(previews)
  },

  selectStyle: (styleId: string) => {
    const selected = generationState$.selectedStyleIds.get()
    if (!selected.includes(styleId)) {
      generationState$.selectedStyleIds.push(styleId)
    }
  },

  deselectStyle: (styleId: string) => {
    const selected = generationState$.selectedStyleIds.get()
    const index = selected.indexOf(styleId)
    if (index > -1) {
      generationState$.selectedStyleIds.splice(index, 1)
    }
  },

  toggleStyle: (styleId: string) => {
    const selected = generationState$.selectedStyleIds.get()
    const index = selected.indexOf(styleId)
    if (index > -1) {
      generationState$.selectedStyleIds.splice(index, 1)
    } else {
      generationState$.selectedStyleIds.push(styleId)
    }
  },

  clearSelection: () => {
    generationState$.selectedStyleIds.set([])
  },

  startPackGeneration: () => {
    generationState$.isGenerating.set(true)
    generationState$.progress.set(0)
    generationState$.error.set(null)
    generationState$.stage.set('pack')
  },

  addPack: (pack: GeneratedPack) => {
    generationState$.packs.push(pack)
  },

  setError: (error: string | null) => {
    generationState$.error.set(error)
    generationState$.isGenerating.set(false)
  },

  reset: () => {
    generationState$.isGenerating.set(false)
    generationState$.generationId.set('')
    generationState$.previews.set([])
    generationState$.packs.set([])
    generationState$.error.set(null)
    generationState$.progress.set(0)
    generationState$.currentStyle.set(null)
    generationState$.stage.set('idle')
  },
}