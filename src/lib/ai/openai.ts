import { aiConfig } from '@/src/lib/config'
import type { ModelEntry } from './registry'

const OPENAI_API_BASE = 'https://api.openai.com/v1/images'

export interface OpenAIImageOptions {
  prompt: string
  referenceImage?: string
  referenceImageMimeType?: string
}

export interface OpenAIImageResult {
  imageBase64: string
  mimeType: string
}

export class OpenAIImageError extends Error {
  constructor(
    message: string,
    public code?: string
  ) {
    super(message)
    this.name = 'OpenAIImageError'
  }
}

export async function generateImage(
  entry: ModelEntry,
  options: OpenAIImageOptions
): Promise<OpenAIImageResult> {
  if (!aiConfig.openaiApiKey) {
    throw new OpenAIImageError('OPENAI_API_KEY not configured', 'NO_API_KEY')
  }

  const response = options.referenceImage
    ? await generateEdit(entry, options)
    : await generateFromText(entry, options)

  if (!response.ok) {
    const errorText = await response.text()
    throw new OpenAIImageError(`OpenAI Images API error: ${errorText}`, 'API_ERROR')
  }

  const data = await response.json() as {
    data?: Array<{ b64_json?: string; url?: string }>
  }

  const first = data.data?.[0]
  if (!first) {
    throw new OpenAIImageError('No image in OpenAI response', 'NO_IMAGE')
  }

  if (first.b64_json) {
    return {
      imageBase64: first.b64_json,
      mimeType: 'image/png',
    }
  }

  if (first.url) {
    const imageResponse = await fetch(first.url)
    if (!imageResponse.ok) {
      throw new OpenAIImageError('Failed to download OpenAI image URL', 'DOWNLOAD_ERROR')
    }
    const buffer = await imageResponse.arrayBuffer()
    return {
      imageBase64: Buffer.from(buffer).toString('base64'),
      mimeType: imageResponse.headers.get('content-type') ?? 'image/png',
    }
  }

  throw new OpenAIImageError('No image data in OpenAI response', 'NO_IMAGE_DATA')
}

function generateFromText(entry: ModelEntry, options: OpenAIImageOptions): Promise<Response> {
  return fetch(`${OPENAI_API_BASE}/generations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${aiConfig.openaiApiKey}`,
    },
    body: JSON.stringify({
      model: entry.remoteModel,
      prompt: options.prompt,
      size: '1024x1024',
      background: 'transparent',
      output_format: 'png',
    }),
  })
}

function generateEdit(entry: ModelEntry, options: OpenAIImageOptions): Promise<Response> {
  const formData = new FormData()
  const mimeType = options.referenceImageMimeType ?? 'image/png'
  const imageBuffer = Buffer.from(options.referenceImage!, 'base64')
  const imageBlob = new Blob([imageBuffer], { type: mimeType })

  formData.append('model', entry.remoteModel)
  formData.append('prompt', options.prompt)
  formData.append('size', '1024x1024')
  formData.append('background', 'transparent')
  formData.append('output_format', 'png')
  formData.append('image[]', imageBlob, `reference.${mimeType.split('/')[1] ?? 'png'}`)

  return fetch(`${OPENAI_API_BASE}/edits`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${aiConfig.openaiApiKey}`,
    },
    body: formData,
  })
}
