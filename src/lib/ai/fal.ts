/**
 * Fal.ai image generation using nano-banana-2
 * https://fal.ai/models/fal-ai/nano-banana-2
 */

import { aiConfig } from '../config'

const FAL_API_BASE = 'https://fal.run'

export interface FalGenerationOptions {
  prompt: string
  referenceImage?: string // base64 data
  referenceImageMimeType?: string
}

export interface FalResult {
  imageBase64: string
  mimeType: string
}

export class FalError extends Error {
  constructor(
    message: string,
    public code?: string
  ) {
    super(message)
    this.name = 'FalError'
  }
}

/**
 * Generate image with Fal.ai nano-banana-2
 */
export async function generateImage(
  options: FalGenerationOptions
): Promise<FalResult> {
  if (!aiConfig.falApiKey) {
    throw new FalError('FAL_API_KEY not configured', 'NO_API_KEY')
  }

  const { prompt, referenceImage, referenceImageMimeType } = options

  const stickerPrompt = buildStickerPrompt(prompt, Boolean(referenceImage))

  const body: Record<string, unknown> = {
    prompt: stickerPrompt,
    resolution: '0.5K', // 512x512 — sufficient for 370x320 stickers, faster + cheaper (0.75x)
    aspect_ratio: '4:3', // closest to 370x320 (1.15:1)
    output_format: 'jpeg', // smaller downloads than PNG; processForLine converts to PNG later
  }

  // Add reference image as data URI if provided
  if (referenceImage) {
    const mime = referenceImageMimeType ?? 'image/png'
    body.image_url = `data:${mime};base64,${referenceImage}`
  }

  const response = await fetch(`${FAL_API_BASE}/${aiConfig.falModel}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Key ${aiConfig.falApiKey}`,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new FalError(`Fal.ai API error: ${errorText}`, 'API_ERROR')
  }

  const data = (await response.json()) as {
    images?: Array<{ url: string; content_type?: string }>
  }

  if (!data.images || data.images.length === 0) {
    throw new FalError('No images in response', 'NO_IMAGE')
  }

  const imageUrl = data.images[0].url
  const contentType = data.images[0].content_type ?? 'image/png'

  // Download the image and convert to base64
  const imageResponse = await fetch(imageUrl)
  if (!imageResponse.ok) {
    throw new FalError('Failed to download generated image', 'DOWNLOAD_ERROR')
  }

  const buffer = await imageResponse.arrayBuffer()
  const imageBase64 = Buffer.from(buffer).toString('base64')

  return {
    imageBase64,
    mimeType: contentType,
  }
}

/**
 * Build sticker-optimized prompt
 */
function buildStickerPrompt(basePrompt: string, hasReference: boolean): string {
  const prefix = hasReference
    ? 'Create a LINE sticker based on this reference image. '
    : 'Create a LINE sticker illustration. '

  return `${prefix}${basePrompt}

Requirements:
- Square composition optimized for 370x320px
- Transparent or simple solid background
- Bold outlines for visibility at small size
- Expressive and clear emotion/action
- Clean, professional sticker art style`
}

/**
 * Check if Fal.ai is available
 */
export function isFalAvailable(): boolean {
  return Boolean(aiConfig.falApiKey)
}

/**
 * Retry wrapper with exponential backoff
 */
export async function generateImageWithRetry(
  options: FalGenerationOptions,
  maxRetries = 3
): Promise<FalResult> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await generateImage(options)
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')

      // Don't retry on config errors
      if (error instanceof FalError) {
        if (error.code === 'NO_API_KEY') {
          throw error
        }
      }

      // Exponential backoff
      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError ?? new FalError('Generation failed after retries', 'MAX_RETRIES')
}
