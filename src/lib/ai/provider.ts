import { generateRunwayImage, type RunwayImageInput } from './runway'

export type GenerateImageOptions = RunwayImageInput
export interface GenerateImageResult {
  imageUrl?: string
  imageBase64?: string
  mimeType?: string
  provider: string
  model?: string
  costCredits?: number
}

export class ProviderError extends Error {
  constructor(message: string, public provider: string, public code?: string) {
    super(message)
    this.name = 'ProviderError'
  }
}

export async function generateImage(options: GenerateImageOptions): Promise<GenerateImageResult> {
  return generateRunwayImage(options)
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
    const response = await fetch(result.imageUrl, { signal: AbortSignal.timeout(30_000) })
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
