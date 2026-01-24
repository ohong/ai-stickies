/**
 * Image processing service for LINE sticker specs
 * Uses sharp for image manipulation
 */

import sharp from 'sharp'
import { LINE_SPECS } from '@/src/constants/line-specs'
import { STICKER_DIMENSIONS, MAIN_IMAGE_DIMENSIONS, TAB_IMAGE_DIMENSIONS } from '../../types/sticker'
import { fetchImageAsBuffer, getBufferSizeKB, detectBackgroundColor } from '@/src/lib/utils/image'

export interface ProcessingOptions {
  width?: number
  height?: number
  maxSizeKB?: number
  maintainAspectRatio?: boolean
}

const DEFAULT_OPTIONS: ProcessingOptions = {
  width: STICKER_DIMENSIONS.maxWidth,
  height: STICKER_DIMENSIONS.maxHeight,
  maxSizeKB: LINE_SPECS.sticker.maxSizeKB - 50, // Leave 50KB margin
  maintainAspectRatio: true,
}

/**
 * Process image for LINE sticker specifications
 * - Resize to fit 370x320 max
 * - Ensure PNG with transparency
 * - Compress to under size limit
 *
 * @param input - Buffer or URL of the source image
 * @param options - Processing options
 * @returns Processed PNG buffer meeting LINE specs
 */
export async function processForLine(
  input: Buffer | string,
  options?: ProcessingOptions
): Promise<Buffer> {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  console.log(`[image-processing] Starting LINE sticker processing`)

  // Load image from buffer or URL
  let imageBuffer: Buffer
  if (typeof input === 'string') {
    console.log(`[image-processing] Fetching image from URL`)
    imageBuffer = await fetchImageAsBuffer(input)
  } else {
    imageBuffer = input
  }

  console.log(`[image-processing] Input size: ${getBufferSizeKB(imageBuffer).toFixed(1)}KB`)

  // Get original dimensions for logging
  const metadata = await sharp(imageBuffer).metadata()
  console.log(`[image-processing] Original dimensions: ${metadata.width}x${metadata.height}`)

  // Start with base processing - ensure alpha channel
  let pipeline = sharp(imageBuffer)
    .ensureAlpha()
    .resize({
      width: opts.width,
      height: opts.height,
      fit: opts.maintainAspectRatio ? 'inside' : 'fill',
      withoutEnlargement: false, // Allow upscaling if needed
    })
    .png({ compressionLevel: 9 })

  let result = await pipeline.toBuffer()
  console.log(`[image-processing] After resize: ${getBufferSizeKB(result).toFixed(1)}KB`)

  // If still too large, progressively reduce quality
  if (opts.maxSizeKB && result.length > opts.maxSizeKB * 1024) {
    result = await compressToSize(imageBuffer, opts)
  }

  console.log(`[image-processing] Final size: ${getBufferSizeKB(result).toFixed(1)}KB`)
  return result
}

/**
 * Compress image to target size with quality reduction
 */
async function compressToSize(
  imageBuffer: Buffer,
  options: ProcessingOptions
): Promise<Buffer> {
  const maxBytes = (options.maxSizeKB ?? 300) * 1024
  let quality = 100
  let result = imageBuffer

  // Try progressively lower quality settings
  while (quality > 10) {
    result = await sharp(imageBuffer)
      .resize({
        width: options.width,
        height: options.height,
        fit: options.maintainAspectRatio ? 'inside' : 'fill',
        withoutEnlargement: true,
      })
      .png({
        compressionLevel: 9,
        quality,
      })
      .toBuffer()

    if (result.length <= maxBytes) {
      break
    }

    quality -= 10
  }

  // If still too large, reduce dimensions
  if (result.length > maxBytes) {
    const scaleFactor = Math.sqrt(maxBytes / result.length)
    const newWidth = Math.floor((options.width ?? STICKER_DIMENSIONS.width) * scaleFactor)
    const newHeight = Math.floor((options.height ?? STICKER_DIMENSIONS.height) * scaleFactor)

    result = await sharp(imageBuffer)
      .resize({
        width: newWidth,
        height: newHeight,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .png({ compressionLevel: 9 })
      .toBuffer()
  }

  return result
}

/**
 * Create main image (240x240) for pack
 * Uses first sticker scaled to fit
 */
export async function createMainImage(stickerBuffer: Buffer): Promise<Buffer> {
  return sharp(stickerBuffer)
    .resize({
      width: MAIN_IMAGE_DIMENSIONS.width,
      height: MAIN_IMAGE_DIMENSIONS.height,
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9 })
    .toBuffer()
}

/**
 * Create tab image (96x74) for LINE
 * Uses first sticker scaled to fit
 */
export async function createTabImage(
  stickerBuffer: Buffer,
  options?: { width?: number; height?: number }
): Promise<Buffer> {
  return sharp(stickerBuffer)
    .resize({
      width: options?.width ?? TAB_IMAGE_DIMENSIONS.width,
      height: options?.height ?? TAB_IMAGE_DIMENSIONS.height,
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9 })
    .toBuffer()
}

/**
 * Create a composite main image from multiple stickers
 * Arranges them in a grid for pack preview
 */
export async function createMainImageComposite(
  stickerBuffers: Buffer[],
  options?: { width?: number; height?: number }
): Promise<Buffer> {
  if (stickerBuffers.length === 0) {
    throw new Error('No stickers provided for main image')
  }

  const width = options?.width ?? MAIN_IMAGE_DIMENSIONS.width
  const height = options?.height ?? MAIN_IMAGE_DIMENSIONS.height

  if (stickerBuffers.length === 1) {
    return sharp(stickerBuffers[0])
      .resize({
        width,
        height,
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png({ compressionLevel: 9 })
      .toBuffer()
  }
  const cellSize = Math.floor(width / 2)

  // Take up to 4 stickers for 2x2 grid
  const stickersToUse = stickerBuffers.slice(0, 4)

  // Resize each sticker to cell size
  const resizedStickers = await Promise.all(
    stickersToUse.map(buf =>
      sharp(buf)
        .resize({
          width: cellSize,
          height: cellSize,
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .toBuffer()
    )
  )

  // Create composite positions
  const positions = [
    { left: 0, top: 0 },
    { left: cellSize, top: 0 },
    { left: 0, top: cellSize },
    { left: cellSize, top: cellSize },
  ]

  const composites = resizedStickers.map((input, i) => ({
    input,
    left: positions[i].left,
    top: positions[i].top,
  }))

  return sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(composites)
    .png({ compressionLevel: 9 })
    .toBuffer()
}

/**
 * Convert image from URL to processed buffer
 */
export async function fetchAndProcess(
  imageUrl: string,
  options?: ProcessingOptions
): Promise<Buffer> {
  const response = await fetch(imageUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  return processForLine(buffer, options)
}

/**
 * Convert base64 to processed buffer
 */
export async function base64ToProcessed(
  base64Data: string,
  options?: ProcessingOptions
): Promise<Buffer> {
  // Remove data URL prefix if present
  const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '')
  const buffer = Buffer.from(cleanBase64, 'base64')

  return processForLine(buffer, options)
}

/**
 * Get image metadata
 */
export async function getImageMetadata(buffer: Buffer) {
  const metadata = await sharp(buffer).metadata()
  return {
    width: metadata.width ?? 0,
    height: metadata.height ?? 0,
    format: metadata.format ?? 'unknown',
    size: buffer.length,
  }
}

/**
 * Ensure transparent background by removing solid backgrounds
 * Detects and removes white or solid color backgrounds
 *
 * @param buffer - Source image buffer
 * @param tolerance - Color matching tolerance (0-255, default 20)
 * @returns Buffer with transparent background
 */
export async function ensureTransparency(
  buffer: Buffer,
  tolerance: number = 20
): Promise<Buffer> {
  console.log(`[image-processing] Ensuring transparency (tolerance: ${tolerance})`)

  const metadata = await sharp(buffer).metadata()

  // If already has alpha and is RGBA, check if we need to process
  if (metadata.hasAlpha && metadata.channels === 4) {
    console.log(`[image-processing] Image already has alpha channel`)
  }

  // Detect background color from corners
  const bgColor = await detectBackgroundColor(buffer)

  if (!bgColor) {
    console.log(`[image-processing] No uniform background detected, adding alpha channel only`)
    return sharp(buffer).ensureAlpha().png().toBuffer()
  }

  console.log(`[image-processing] Detected background color: rgb(${bgColor.r}, ${bgColor.g}, ${bgColor.b})`)

  // Check if it's a white-ish background or solid gray
  const isWhiteBg = bgColor.r > 240 && bgColor.g > 240 && bgColor.b > 240
  const isSolidBg = bgColor.r === bgColor.g && bgColor.g === bgColor.b

  if (isWhiteBg || isSolidBg) {
    // Remove the background color by making it transparent
    // Use raw pixel manipulation for precise control
    const { data, info } = await sharp(buffer)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })

    const pixels = new Uint8Array(data)

    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i]
      const g = pixels[i + 1]
      const b = pixels[i + 2]

      // Check if pixel matches background color within tolerance
      if (
        Math.abs(r - bgColor.r) <= tolerance &&
        Math.abs(g - bgColor.g) <= tolerance &&
        Math.abs(b - bgColor.b) <= tolerance
      ) {
        // Make pixel transparent
        pixels[i + 3] = 0
      }
    }

    const result = await sharp(Buffer.from(pixels), {
      raw: {
        width: info.width,
        height: info.height,
        channels: 4,
      },
    })
      .png()
      .toBuffer()

    console.log(`[image-processing] Background removed`)
    return result
  }

  // No solid background to remove, just ensure alpha
  return sharp(buffer).ensureAlpha().png().toBuffer()
}

/**
 * Compress image to meet size limit (public API)
 *
 * @param buffer - Source image buffer
 * @param maxSizeKB - Maximum size in KB
 * @returns Compressed PNG buffer
 */
export async function compressImage(
  buffer: Buffer,
  maxSizeKB: number
): Promise<Buffer> {
  const initialSize = getBufferSizeKB(buffer)
  console.log(`[image-processing] Compressing from ${initialSize.toFixed(1)}KB to under ${maxSizeKB}KB`)

  if (initialSize <= maxSizeKB) {
    console.log(`[image-processing] Already under size limit`)
    return buffer
  }

  let result = buffer
  let compressionLevel = 6 // Start with moderate compression (0-9)

  // Try increasing compression
  while (getBufferSizeKB(result) > maxSizeKB && compressionLevel < 9) {
    compressionLevel++
    result = await sharp(buffer)
      .png({
        compressionLevel,
        effort: 10,
        palette: false,
      })
      .toBuffer()

    console.log(`[image-processing] Compression level ${compressionLevel}: ${getBufferSizeKB(result).toFixed(1)}KB`)
  }

  // If still too large, try palette-based compression
  if (getBufferSizeKB(result) > maxSizeKB) {
    console.log(`[image-processing] Trying palette-based compression`)
    result = await sharp(buffer)
      .png({
        compressionLevel: 9,
        effort: 10,
        palette: true,
        colors: 256,
      })
      .toBuffer()

    console.log(`[image-processing] Palette compression: ${getBufferSizeKB(result).toFixed(1)}KB`)
  }

  // If still too large, reduce dimensions
  if (getBufferSizeKB(result) > maxSizeKB) {
    console.log(`[image-processing] Reducing dimensions to meet size limit`)
    const metadata = await sharp(buffer).metadata()
    let scale = 0.9

    while (getBufferSizeKB(result) > maxSizeKB && scale > 0.5) {
      const newWidth = Math.round((metadata.width || STICKER_DIMENSIONS.width) * scale)
      const newHeight = Math.round((metadata.height || STICKER_DIMENSIONS.height) * scale)

      result = await sharp(buffer)
        .resize(newWidth, newHeight, { fit: 'inside' })
        .png({
          compressionLevel: 9,
          effort: 10,
          palette: true,
          colors: 256,
        })
        .toBuffer()

      console.log(`[image-processing] Scale ${(scale * 100).toFixed(0)}%: ${getBufferSizeKB(result).toFixed(1)}KB`)
      scale -= 0.1
    }
  }

  const finalSize = getBufferSizeKB(result)
  if (finalSize > maxSizeKB) {
    console.warn(`[image-processing] Could not compress below ${maxSizeKB}KB, final size: ${finalSize.toFixed(1)}KB`)
  }

  return result
}

/**
 * Process multiple stickers and create a complete LINE pack
 *
 * @param stickerInputs - Array of sticker buffers or URLs
 * @returns Object containing main, tab, and sticker buffers
 */
export async function processLinePack(
  stickerInputs: (Buffer | string)[]
): Promise<{
  main: Buffer
  tab: Buffer
  stickers: Buffer[]
}> {
  console.log(`[image-processing] Processing pack with ${stickerInputs.length} stickers`)

  if (stickerInputs.length === 0) {
    throw new Error('At least one sticker is required')
  }

  // Process all stickers in parallel
  const stickers = await Promise.all(
    stickerInputs.map((input) => processForLine(input))
  )

  // Create main and tab images from processed stickers
  const main = await createMainImageComposite(stickers)
  const tab = await createTabImage(stickers[0])

  console.log(`[image-processing] Pack processing complete`)

  return { main, tab, stickers }
}

/**
 * Resize image for LINE marketplace specifications
 * LINE marketplace requires stickers at 370x320px max
 *
 * @param buffer - Source image buffer
 * @returns Resized PNG buffer at 370x320
 */
export async function resizeForMarketplace(buffer: Buffer): Promise<Buffer> {
  const MARKETPLACE_WIDTH = 370
  const MARKETPLACE_HEIGHT = 320
  const MAX_SIZE_KB = 300

  console.log(`[image-processing] Resizing for marketplace (${MARKETPLACE_WIDTH}x${MARKETPLACE_HEIGHT})`)

  // Get original metadata
  const metadata = await sharp(buffer).metadata()
  console.log(`[image-processing] Original: ${metadata.width}x${metadata.height}`)

  // Resize to marketplace dimensions
  let result = await sharp(buffer)
    .resize({
      width: MARKETPLACE_WIDTH,
      height: MARKETPLACE_HEIGHT,
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .ensureAlpha()
    .png({ compressionLevel: 9 })
    .toBuffer()

  console.log(`[image-processing] After resize: ${getBufferSizeKB(result).toFixed(1)}KB`)

  // Ensure under size limit
  if (getBufferSizeKB(result) > MAX_SIZE_KB) {
    result = await compressImage(result, MAX_SIZE_KB)
  }

  return result
}
