/**
 * Fal.ai image generation using nano-banana-2
 * https://fal.ai/models/fal-ai/nano-banana-2
 */

import { aiConfig } from '../config'
import type { ModelEntry } from './registry'

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
  entry: ModelEntry,
  options: FalGenerationOptions
): Promise<FalResult> {
  if (!aiConfig.falApiKey) {
    throw new FalError('FAL_API_KEY not configured', 'NO_API_KEY')
  }

  const { prompt, referenceImage, referenceImageMimeType } = options

  const body: Record<string, unknown> = {
    prompt,
    resolution: '0.5K', // 512x512 — sufficient for 370x320 stickers, faster + cheaper (0.75x)
    aspect_ratio: '4:3', // closest to 370x320 (1.15:1)
    output_format: 'jpeg', // smaller downloads than PNG; processForLine converts to PNG later
  }

  // Add reference image as data URI if provided
  if (referenceImage) {
    const mime = referenceImageMimeType ?? 'image/png'
    body.image_url = `data:${mime};base64,${referenceImage}`
  }

  const response = await fetch(`${FAL_API_BASE}/${entry.remoteModel}`, {
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
 * Check if Fal.ai is available
 */
export function isFalAvailable(): boolean {
  return Boolean(aiConfig.falApiKey)
}

/**
 * Retry wrapper with exponential backoff
 */
