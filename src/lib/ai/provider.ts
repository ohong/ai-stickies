/**
 * Unified AI provider interface
 * Abstracts FLUX and Fal.ai behind common interface
 */

import * as flux from './flux'
import * as fal from './fal'
import { featureFlags } from '../config'

export type ImageProvider = 'flux' | 'fal'

export interface GenerateImageOptions {
  prompt: string
  referenceImage?: string // base64 for Fal, URL or base64 for FLUX
  referenceImageMimeType?: string
  provider?: ImageProvider
  width?: number
  height?: number
}

export interface GenerateImageResult {
  imageUrl?: string // FLUX returns URL
  imageBase64?: string // Fal returns base64
  mimeType?: string
  provider: ImageProvider
}

export class ProviderError extends Error {
  constructor(
    message: string,
    public provider: ImageProvider,
    public code?: string
  ) {
    super(message)
    this.name = 'ProviderError'
  }
}

/**
 * Get default provider based on config and availability
 */
export function getDefaultProvider(): ImageProvider {
  // Prefer Fal (nano-banana-2) if enabled and available
  if (featureFlags.enableFal && fal.isFalAvailable()) {
    return 'fal'
  }

  // Fall back to FLUX
  if (featureFlags.enableFlux && flux.isFluxAvailable()) {
    return 'flux'
  }

  throw new ProviderError(
    'No image provider available. Configure FAL_API_KEY or BFL_API_KEY.',
    'fal',
    'NO_PROVIDER'
  )
}

/**
 * Check which providers are available
 */
export function getAvailableProviders(): ImageProvider[] {
  const providers: ImageProvider[] = []

  if (featureFlags.enableFlux && flux.isFluxAvailable()) {
    providers.push('flux')
  }

  if (featureFlags.enableFal && fal.isFalAvailable()) {
    providers.push('fal')
  }

  return providers
}

/**
 * Generate image using specified or default provider
 */
export async function generateImage(
  options: GenerateImageOptions
): Promise<GenerateImageResult> {
  const provider = options.provider ?? getDefaultProvider()

  try {
    if (provider === 'flux') {
      return await generateWithFlux(options)
    } else {
      return await generateWithFal(options)
    }
  } catch (error) {
    // Wrap in ProviderError if not already
    if (error instanceof ProviderError) {
      throw error
    }

    const message = error instanceof Error ? error.message : 'Unknown error'
    throw new ProviderError(message, provider, 'GENERATION_ERROR')
  }
}

async function generateWithFlux(
  options: GenerateImageOptions
): Promise<GenerateImageResult> {
  if (!flux.isFluxAvailable()) {
    throw new ProviderError('FLUX not available', 'flux', 'NOT_AVAILABLE')
  }

  const result = await flux.generateImage({
    prompt: options.prompt,
    inputImage: options.referenceImage,
    width: options.width,
    height: options.height,
  })

  return {
    imageUrl: result.imageUrl,
    provider: 'flux',
  }
}

async function generateWithFal(
  options: GenerateImageOptions
): Promise<GenerateImageResult> {
  if (!fal.isFalAvailable()) {
    throw new ProviderError('Fal not available', 'fal', 'NOT_AVAILABLE')
  }

  const result = await fal.generateImageWithRetry({
    prompt: options.prompt,
    referenceImage: options.referenceImage,
    referenceImageMimeType: options.referenceImageMimeType,
  })

  return {
    imageBase64: result.imageBase64,
    mimeType: result.mimeType,
    provider: 'fal',
  }
}

/**
 * Generate image with automatic fallback
 * Tries primary provider, falls back to secondary on failure
 */
export async function generateImageWithFallback(
  options: GenerateImageOptions
): Promise<GenerateImageResult> {
  const providers = getAvailableProviders()

  if (providers.length === 0) {
    throw new ProviderError(
      'No image providers available',
      'flux',
      'NO_PROVIDER'
    )
  }

  // Put preferred provider first
  const primaryProvider = options.provider ?? getDefaultProvider()
  const orderedProviders = [
    primaryProvider,
    ...providers.filter(p => p !== primaryProvider),
  ].filter((p, i, arr) => arr.indexOf(p) === i) // dedupe

  let lastError: Error | null = null

  for (const provider of orderedProviders) {
    try {
      return await generateImage({ ...options, provider })
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')
      console.warn(`Provider ${provider} failed:`, lastError.message)

      // Continue to next provider
    }
  }

  throw lastError ?? new ProviderError('All providers failed', primaryProvider, 'ALL_FAILED')
}

/**
 * Convert image result to base64 (downloads URL if needed)
 */
export async function resultToBase64(
  result: GenerateImageResult
): Promise<{ data: string; mimeType: string }> {
  if (result.imageBase64) {
    return {
      data: result.imageBase64,
      mimeType: result.mimeType ?? 'image/png',
    }
  }

  if (result.imageUrl) {
    const response = await fetch(result.imageUrl)
    if (!response.ok) {
      throw new ProviderError(
        `Failed to download image: ${response.status}`,
        result.provider,
        'DOWNLOAD_ERROR'
      )
    }

    const buffer = await response.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    const contentType = response.headers.get('content-type') ?? 'image/png'

    return {
      data: base64,
      mimeType: contentType,
    }
  }

  throw new ProviderError('No image data in result', result.provider, 'NO_DATA')
}

/**
 * Convert image result to URL (creates data URL if needed)
 */
export function resultToUrl(result: GenerateImageResult): string {
  if (result.imageUrl) {
    return result.imageUrl
  }

  if (result.imageBase64) {
    const mimeType = result.mimeType ?? 'image/png'
    return `data:${mimeType};base64,${result.imageBase64}`
  }

  throw new ProviderError('No image data in result', result.provider, 'NO_DATA')
}
