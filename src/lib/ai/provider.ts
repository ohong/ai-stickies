/**
 * Unified AI model interface.
 * Models are selected through the registry and dispatched to transport adapters.
 */

import * as flux from './flux'
import * as fal from './fal'
import * as openai from './openai'
import {
  getAvailableModels as getRegistryAvailableModels,
  getDefaultModel as getRegistryDefaultModel,
  getModel,
  isModelAvailable,
  type ModelEntry,
} from './registry'

export type ImageProvider = string

export interface GenerateImageOptions {
  prompt: string
  referenceImage?: string
  referenceImageMimeType?: string
  provider?: ImageProvider
  model?: ImageProvider
  width?: number
  height?: number
  maxAttemptsPerModel?: number
  maxFallbackModels?: number
}

export interface GenerateImageResult {
  imageUrl?: string
  imageBase64?: string
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

export function getDefaultProvider(): ImageProvider {
  try {
    return getRegistryDefaultModel().id
  } catch (error) {
    throw new ProviderError(
      error instanceof Error ? error.message : 'No image model available',
      'unknown',
      'NO_PROVIDER'
    )
  }
}

export function getAvailableProviders(): ImageProvider[] {
  return getRegistryAvailableModels().map((entry) => entry.id)
}

export async function generateImage(
  options: GenerateImageOptions
): Promise<GenerateImageResult> {
  const model = resolveRequestedModel(options)

  if (!isModelAvailable(model)) {
    throw new ProviderError(`${model.id} not available`, model.id, 'NOT_AVAILABLE')
  }

  try {
    const result = await generateWithRetry(model, options)
    return {
      ...result,
      provider: model.id,
    }
  } catch (error) {
    if (error instanceof ProviderError) {
      throw error
    }

    const message = error instanceof Error ? error.message : 'Unknown error'
    throw new ProviderError(message, model.id, 'GENERATION_ERROR')
  }
}

export async function generateImageWithFallback(
  options: GenerateImageOptions
): Promise<GenerateImageResult> {
  const availableModels = getRegistryAvailableModels()

  if (availableModels.length === 0) {
    throw new ProviderError(
      'No image models available',
      'unknown',
      'NO_PROVIDER'
    )
  }

  const primaryModel = resolveRequestedModel(options)
  const orderedModels = [
    primaryModel,
    ...availableModels.filter((model) => model.id !== primaryModel.id),
  ].filter((model, index, models) => models.findIndex((m) => m.id === model.id) === index)
  const modelsToTry = orderedModels.slice(0, options.maxFallbackModels ?? orderedModels.length)

  let lastError: Error | null = null

  for (const model of modelsToTry) {
    if (!isModelAvailable(model)) continue

    try {
      return await generateImage({ ...options, model: model.id, provider: undefined })
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')
      console.warn(`Image model ${model.id} failed:`, lastError.message)
    }
  }

  throw lastError ?? new ProviderError('All image models failed', primaryModel.id, 'ALL_FAILED')
}

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

function resolveRequestedModel(options: GenerateImageOptions): ModelEntry {
  const requested = options.model ?? options.provider
  if (requested) {
    return getModel(normalizeModelId(requested))
  }
  return getRegistryDefaultModel()
}

function normalizeModelId(modelId: string): string {
  if (modelId === 'fal') return 'nano-banana-2'
  if (modelId === 'flux') return 'flux-2-pro'
  return modelId
}

async function generateWithRetry(
  model: ModelEntry,
  options: GenerateImageOptions,
  maxRetries = options.maxAttemptsPerModel ?? 3
): Promise<Omit<GenerateImageResult, 'provider'>> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await generateWithAdapter(model, options)
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')

      if (isConfigError(error)) {
        throw lastError
      }

      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError ?? new ProviderError('Generation failed after retries', model.id, 'MAX_RETRIES')
}

async function generateWithAdapter(
  model: ModelEntry,
  options: GenerateImageOptions
): Promise<Omit<GenerateImageResult, 'provider'>> {
  switch (model.adapter) {
    case 'fal': {
      const result = await fal.generateImage(model, {
        prompt: options.prompt,
        referenceImage: options.referenceImage,
        referenceImageMimeType: options.referenceImageMimeType,
      })
      return {
        imageBase64: result.imageBase64,
        mimeType: result.mimeType,
      }
    }
    case 'bfl': {
      const result = await flux.generateImage(model, {
        prompt: options.prompt,
        inputImage: options.referenceImage,
        width: options.width,
        height: options.height,
      })
      return {
        imageUrl: result.imageUrl,
      }
    }
    case 'openai': {
      const result = await openai.generateImage(model, {
        prompt: options.prompt,
        referenceImage: options.referenceImage,
        referenceImageMimeType: options.referenceImageMimeType,
      })
      return {
        imageBase64: result.imageBase64,
        mimeType: result.mimeType,
      }
    }
  }
}

function isConfigError(error: unknown): boolean {
  return error instanceof Error && error.message.includes('API_KEY not configured')
}
