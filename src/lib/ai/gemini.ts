/**
 * Google Gemini image generation
 * Uses @google/generative-ai package
 */

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai'
import { aiConfig } from '../config'

export interface GeminiGenerationOptions {
  prompt: string
  referenceImage?: string // base64 data
  referenceImageMimeType?: string
}

export interface GeminiResult {
  imageBase64: string
  mimeType: string
}

export class GeminiError extends Error {
  constructor(
    message: string,
    public code?: string
  ) {
    super(message)
    this.name = 'GeminiError'
  }
}

let client: GoogleGenerativeAI | null = null
let model: GenerativeModel | null = null

function getClient(): GoogleGenerativeAI {
  if (!aiConfig.geminiApiKey) {
    throw new GeminiError('Gemini API key not configured', 'NO_API_KEY')
  }

  if (!client) {
    client = new GoogleGenerativeAI(aiConfig.geminiApiKey)
  }

  return client
}

function getModel(): GenerativeModel {
  if (!model) {
    model = getClient().getGenerativeModel({
      model: aiConfig.geminiModel,
      generationConfig: {
        // @ts-expect-error - responseModalities is valid for image generation
        responseModalities: ['Text', 'Image'],
      },
    })
  }

  return model
}

/**
 * Generate image with Gemini
 */
export async function generateImage(
  options: GeminiGenerationOptions
): Promise<GeminiResult> {
  const { prompt, referenceImage, referenceImageMimeType } = options
  const genModel = getModel()

  try {
    // Build content parts
    const parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = []

    // Add reference image if provided
    if (referenceImage) {
      parts.push({
        inlineData: {
          data: referenceImage,
          mimeType: referenceImageMimeType ?? 'image/png',
        },
      })
    }

    // Add prompt with sticker-specific instructions
    const stickerPrompt = buildStickerPrompt(prompt, Boolean(referenceImage))
    parts.push({ text: stickerPrompt })

    const response = await genModel.generateContent(parts)
    const result = response.response

    // Extract image from response
    const candidates = result.candidates
    if (!candidates || candidates.length === 0) {
      throw new GeminiError('No candidates in response', 'NO_CANDIDATES')
    }

    const content = candidates[0].content
    if (!content || !content.parts) {
      throw new GeminiError('No content in response', 'NO_CONTENT')
    }

    // Find image part
    for (const part of content.parts) {
      if ('inlineData' in part && part.inlineData) {
        return {
          imageBase64: part.inlineData.data,
          mimeType: part.inlineData.mimeType ?? 'image/png',
        }
      }
    }

    throw new GeminiError('No image in response', 'NO_IMAGE')
  } catch (error) {
    if (error instanceof GeminiError) {
      throw error
    }

    const message = error instanceof Error ? error.message : 'Unknown error'
    throw new GeminiError(`Gemini generation failed: ${message}`, 'GENERATION_ERROR')
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
 * Check if Gemini is available
 */
export function isGeminiAvailable(): boolean {
  return Boolean(aiConfig.geminiApiKey)
}

/**
 * Retry wrapper with exponential backoff
 */
export async function generateImageWithRetry(
  options: GeminiGenerationOptions,
  maxRetries = 3
): Promise<GeminiResult> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await generateImage(options)
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')

      // Don't retry on certain errors
      if (error instanceof GeminiError) {
        if (error.code === 'NO_API_KEY' || error.code === 'NO_CANDIDATES') {
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

  throw lastError ?? new GeminiError('Generation failed after retries', 'MAX_RETRIES')
}
