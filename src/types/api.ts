import type { Language, FidelityLevel, GenerationStatus, Generation, StylePreview, StickerPack, Sticker } from './database'

// Generic API response wrapper
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// Session endpoints
export interface CreateSessionResponse {
  sessionId: string
  maxGenerations: number
}

export interface SessionStatusResponse {
  generationCount: number
  maxGenerations: number
  remainingGenerations: number
}

// Upload endpoints
export interface UploadRequest {
  sessionId: string
  file: File
}

export interface UploadResponse {
  uploadId: string
  storagePath: string
}

// Generation endpoints
export interface StartGenerationRequest {
  sessionId: string
  uploadId: string
  styleDescription?: string
  personalContext?: string
  language: Language
}

export interface StartGenerationResponse {
  generationId: string
  status: GenerationStatus
}

export interface GenerationStatusResponse {
  generation: Generation
  previews?: StylePreview[]
}

// Style preview endpoints
export interface SelectStyleRequest {
  generationId: string
  stylePreviewId: string
}

export interface SelectStyleResponse {
  packId: string
  status: GenerationStatus
}

// Sticker pack endpoints
export interface StickerPackStatusResponse {
  pack: StickerPack
  stickers: Sticker[]
  isComplete: boolean
}

export interface DownloadPackResponse {
  downloadUrl: string
  expiresAt: string
}

// Image generation request
export interface ImageGenerationRequest {
  prompt: string
  style: FidelityLevel
  referenceImageUrl?: string
  width?: number
  height?: number
}

export interface ImageGenerationResponse {
  imageUrl: string
  provider: 'gemini' | 'flux'
}

// Polling types
export interface PollOptions {
  maxAttempts?: number
  intervalMs?: number
  onProgress?: (attempt: number) => void
}

// Preview generation endpoints
export interface GeneratePreviewsRequest {
  uploadId: string
  styleDescription?: string
  personalContext?: string
  language: Language
  provider?: 'gemini' | 'flux'
}

export interface GeneratedPreview {
  id: string
  styleName: string
  fidelityLevel: FidelityLevel
  description: string
  previewUrl: string
}

export interface GeneratePreviewsResponse {
  generationId: string
  previews: GeneratedPreview[]
  remainingGenerations: number
}

// Pack generation endpoints
export interface GeneratePacksRequest {
  generationId: string
  selectedStyleIds: string[]
}

export interface GeneratedSticker {
  id: string
  sequenceNumber: number
  imageUrl: string
  emotion: string | null
  hasText: boolean
  textContent: string | null
}

export interface GeneratedPack {
  id: string
  styleName: string
  stickers: GeneratedSticker[]
  zipUrl: string | null
}

export interface GeneratePacksResponse {
  packs: GeneratedPack[]
  remainingGenerations: number
  errors: string[]
}

export interface GenerationProgressResponse {
  status: GenerationStatus
  progress: {
    currentStep: number
    totalSteps: number
    completedStickers: number
    totalStickers: number
    message: string
  }
  packs?: Array<{
    id: string
    styleName: string
    stickers: Array<{
      id: string
      sequenceNumber: number
      imageUrl: string
      emotion: string | null
    }>
    zipUrl: string | null
  }>
}
