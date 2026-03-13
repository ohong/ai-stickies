/**
 * AI module exports
 */

// Individual providers
export * as flux from './flux'
export * as fal from './fal'
export * as fireworks from './fireworks'

// Unified provider interface
export {
  generateImage,
  generateImageWithFallback,
  getDefaultProvider,
  getAvailableProviders,
  resultToBase64,
  resultToUrl,
  ProviderError,
  type ImageProvider,
  type GenerateImageOptions,
  type GenerateImageResult,
} from './provider'

// Fireworks prompt generation
export {
  generateStickerPrompts,
  generatePreviewPrompt,
  generateStickerPromptsWithRetry,
  type StickerPrompt,
  type PromptGenerationInput,
} from './fireworks'
