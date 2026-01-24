import sharp from 'sharp'
import { LINE_SPECS, type LineAssetType } from '@/src/constants/line-specs'

/**
 * Fetch image from URL and return as Buffer
 */
export async function fetchImageAsBuffer(url: string): Promise<Buffer> {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`)
    }

    const contentType = response.headers.get('content-type')
    if (contentType && !contentType.startsWith('image/')) {
      throw new Error(`Invalid content type: expected image/*, got ${contentType}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch image from URL: ${error.message}`)
    }
    throw new Error('Failed to fetch image from URL: Unknown error')
  }
}

/**
 * Convert base64 string to Buffer
 * Handles both raw base64 and data URL formats
 */
export function base64ToBuffer(base64: string): Buffer {
  // Remove data URL prefix if present (e.g., "data:image/png;base64,")
  const base64Data = base64.includes(',')
    ? base64.split(',')[1]
    : base64

  return Buffer.from(base64Data, 'base64')
}

/**
 * Convert Buffer to base64 string
 */
export function bufferToBase64(buffer: Buffer, mimeType: string = 'image/png'): string {
  const base64 = buffer.toString('base64')
  return `data:${mimeType};base64,${base64}`
}

/**
 * Get image dimensions and metadata
 */
export async function getImageDimensions(
  buffer: Buffer
): Promise<{ width: number; height: number; format?: string; hasAlpha?: boolean }> {
  try {
    const metadata = await sharp(buffer).metadata()

    if (!metadata.width || !metadata.height) {
      throw new Error('Could not determine image dimensions')
    }

    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      hasAlpha: metadata.hasAlpha,
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get image dimensions: ${error.message}`)
    }
    throw new Error('Failed to get image dimensions: Unknown error')
  }
}

/**
 * Get image file size in KB
 */
export function getBufferSizeKB(buffer: Buffer): number {
  return buffer.length / 1024
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Validate image meets LINE specs for a given asset type
 */
export async function validateLineSpecs(
  buffer: Buffer,
  type: LineAssetType
): Promise<ValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []

  try {
    const { width, height, format, hasAlpha } = await getImageDimensions(buffer)
    const sizeKB = getBufferSizeKB(buffer)
    const spec = LINE_SPECS[type]

    // Check format
    if (format !== 'png') {
      errors.push(`Invalid format: expected PNG, got ${format || 'unknown'}`)
    }

    // Check transparency
    if (!hasAlpha) {
      warnings.push('Image has no alpha channel - may not have transparent background')
    }

    // Check size
    if (sizeKB > spec.maxSizeKB) {
      errors.push(
        `File size ${sizeKB.toFixed(1)}KB exceeds maximum ${spec.maxSizeKB}KB`
      )
    }

    // Check dimensions based on type
    if (type === 'sticker') {
      const stickerSpec = LINE_SPECS.sticker
      if (width > stickerSpec.maxWidth) {
        errors.push(`Width ${width}px exceeds maximum ${stickerSpec.maxWidth}px`)
      }
      if (height > stickerSpec.maxHeight) {
        errors.push(`Height ${height}px exceeds maximum ${stickerSpec.maxHeight}px`)
      }
    } else {
      // main and tab have exact dimensions
      const assetSpec = LINE_SPECS[type]
      if (width !== assetSpec.width || height !== assetSpec.height) {
        errors.push(
          `Dimensions ${width}x${height}px must be exactly ${assetSpec.width}x${assetSpec.height}px`
        )
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    }
  } catch (error) {
    return {
      valid: false,
      errors: [error instanceof Error ? error.message : 'Unknown validation error'],
      warnings,
    }
  }
}

/**
 * Check if buffer is a valid image
 */
export async function isValidImage(buffer: Buffer): Promise<boolean> {
  try {
    await sharp(buffer).metadata()
    return true
  } catch {
    return false
  }
}

/**
 * Detect if image has a solid background color
 * Returns the dominant corner color if corners are similar
 */
export async function detectBackgroundColor(
  buffer: Buffer
): Promise<{ r: number; g: number; b: number } | null> {
  try {
    const image = sharp(buffer)
    const { width, height } = await image.metadata()

    if (!width || !height) return null

    // Sample 4 corners (5x5 pixel areas)
    const cornerSize = 5
    const corners = [
      { left: 0, top: 0 },
      { left: width - cornerSize, top: 0 },
      { left: 0, top: height - cornerSize },
      { left: width - cornerSize, top: height - cornerSize },
    ]

    const cornerColors: Array<{ r: number; g: number; b: number }> = []

    for (const corner of corners) {
      const { data } = await sharp(buffer)
        .extract({ left: corner.left, top: corner.top, width: cornerSize, height: cornerSize })
        .raw()
        .toBuffer({ resolveWithObject: true })

      // Average the corner colors
      let r = 0, g = 0, b = 0
      const pixelCount = cornerSize * cornerSize
      for (let i = 0; i < data.length; i += 3) {
        r += data[i]
        g += data[i + 1]
        b += data[i + 2]
      }
      cornerColors.push({
        r: Math.round(r / pixelCount),
        g: Math.round(g / pixelCount),
        b: Math.round(b / pixelCount),
      })
    }

    // Check if all corners are similar (within threshold)
    const threshold = 30
    const first = cornerColors[0]
    const allSimilar = cornerColors.every(
      (c) =>
        Math.abs(c.r - first.r) < threshold &&
        Math.abs(c.g - first.g) < threshold &&
        Math.abs(c.b - first.b) < threshold
    )

    return allSimilar ? first : null
  } catch {
    return null
  }
}
