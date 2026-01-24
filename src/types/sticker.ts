import type { Language, FidelityLevel } from './database'

// Sticker dimensions per LINE spec
export interface StickerDimensions {
  width: number
  height: number
  maxWidth: number
  maxHeight: number
}

export const STICKER_DIMENSIONS: StickerDimensions = {
  width: 370,
  height: 320,
  maxWidth: 370,
  maxHeight: 320,
}

export const MAIN_IMAGE_DIMENSIONS = {
  width: 240,
  height: 240,
}

export const TAB_IMAGE_DIMENSIONS = {
  width: 96,
  height: 74,
}

// Pack configuration
export interface PackConfig {
  stickerCount: 8 | 16 | 24 | 32 | 40
  includesMainImage: boolean
  includesTabImage: boolean
}

export const DEFAULT_PACK_CONFIG: PackConfig = {
  stickerCount: 8,
  includesMainImage: true,
  includesTabImage: true,
}

// Style configuration
export interface StyleConfig {
  id: FidelityLevel
  name: string
  description: string
  promptModifiers: string[]
  textStyle: TextStyleConfig
  exampleEmoji: string
}

export interface TextStyleConfig {
  font: string
  color: string
  strokeColor: string
  strokeWidth: number
  position: 'top' | 'bottom' | 'center'
  maxLength: number
}

// Emotion/scenario definition
export interface EmotionConfig {
  id: string
  labelKey: string
  emoji: string
  promptHint: string
  suggestedText: Record<Language, string>
}

// Generation workflow state
export interface GenerationWorkflowState {
  step: 'upload' | 'configure' | 'preview' | 'generate' | 'download'
  uploadId: string | null
  selectedStyle: FidelityLevel | null
  selectedEmotions: string[]
  language: Language
  personalContext: string | null
}

// Sticker generation result
export interface StickerGenerationResult {
  stickerId: string
  emotion: string
  imageUrl: string
  textContent: string | null
  promptUsed: string
}

// Pack export format
export interface PackExportOptions {
  format: 'user' | 'marketplace'
  includeMetadata: boolean
}
