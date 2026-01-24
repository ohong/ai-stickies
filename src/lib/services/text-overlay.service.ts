/**
 * Text overlay service for LINE stickers
 * Adds text to sticker images using SVG overlays
 */

import sharp from 'sharp'
import type { Language } from '@/src/types'
import { SUPPORTED_FONTS } from '@/src/constants/line-specs'
import { STICKER_DIMENSIONS } from '@/src/types/sticker'

export interface TextOverlayOptions {
  language?: Language
  fontSize?: number
  fontWeight?: 'normal' | 'bold'
  color?: string
  outlineColor?: string
  outlineWidth?: number
  position?: 'top' | 'bottom' | 'center'
  padding?: number
  maxWidth?: number
}

const DEFAULT_OPTIONS: Required<TextOverlayOptions> = {
  language: 'en',
  fontSize: 32,
  fontWeight: 'bold',
  color: '#FFFFFF',
  outlineColor: '#000000',
  outlineWidth: 2,
  position: 'bottom',
  padding: 16,
  maxWidth: 350, // Slightly less than sticker width for padding
}

/**
 * Add text overlay to sticker image
 * Uses sharp's composite with SVG text overlay
 *
 * @param buffer - Source sticker image buffer
 * @param text - Text to overlay
 * @param options - Styling options
 * @returns Buffer with text overlay
 */
export async function addTextOverlay(
  buffer: Buffer,
  text: string,
  options: TextOverlayOptions = {}
): Promise<Buffer> {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  console.log(`[text-overlay] Adding text: "${text}" at ${opts.position}`)

  // Get image dimensions
  const metadata = await sharp(buffer).metadata()
  const width = metadata.width || STICKER_DIMENSIONS.width
  const height = metadata.height || STICKER_DIMENSIONS.height

  // Get font for language
  const fontFamily = SUPPORTED_FONTS[opts.language] || 'sans-serif'

  // Calculate text position
  const textY = calculateTextY(opts.position, height, opts.fontSize, opts.padding)

  // Escape special characters for SVG
  const escapedText = escapeXml(text)

  // Create SVG with text
  // Using paint-order to put stroke behind fill for cleaner outline
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <style>
        .text {
          font-family: '${fontFamily}', sans-serif;
          font-size: ${opts.fontSize}px;
          font-weight: ${opts.fontWeight};
          fill: ${opts.color};
          stroke: ${opts.outlineColor};
          stroke-width: ${opts.outlineWidth}px;
          paint-order: stroke fill;
          text-anchor: middle;
          dominant-baseline: middle;
        }
      </style>
      <text x="${width / 2}" y="${textY}" class="text">
        ${wrapText(escapedText, opts.maxWidth, opts.fontSize)}
      </text>
    </svg>
  `

  // Composite text over image
  const result = await sharp(buffer)
    .composite([
      {
        input: Buffer.from(svg),
        top: 0,
        left: 0,
      },
    ])
    .png()
    .toBuffer()

  console.log(`[text-overlay] Text overlay complete`)
  return result
}

/**
 * Calculate Y position for text based on position preference
 */
function calculateTextY(
  position: 'top' | 'bottom' | 'center',
  height: number,
  fontSize: number,
  padding: number
): number {
  switch (position) {
    case 'top':
      return padding + fontSize / 2
    case 'bottom':
      return height - padding - fontSize / 2
    case 'center':
    default:
      return height / 2
  }
}

/**
 * Escape XML special characters
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Wrap text into multiple tspan elements if too long
 * Returns SVG tspan elements
 */
function wrapText(text: string, maxWidth: number, fontSize: number): string {
  // Rough estimation: average character width is about 0.6 * fontSize
  const avgCharWidth = fontSize * 0.6
  const maxChars = Math.floor(maxWidth / avgCharWidth)

  if (text.length <= maxChars) {
    return text
  }

  // Split into lines
  const words = text.split(/\s+/)
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= maxChars) {
      currentLine = (currentLine + ' ' + word).trim()
    } else {
      if (currentLine) lines.push(currentLine)
      currentLine = word
    }
  }
  if (currentLine) lines.push(currentLine)

  // Create tspan elements for each line
  const lineHeight = fontSize * 1.2
  const startY = -(lines.length - 1) * lineHeight / 2

  return lines
    .map((line, i) => `<tspan x="50%" dy="${i === 0 ? startY : lineHeight}">${line}</tspan>`)
    .join('')
}

/**
 * Add text with shadow effect for better readability
 *
 * @param buffer - Source image buffer
 * @param text - Text to overlay
 * @param options - Styling options
 * @returns Buffer with shadowed text overlay
 */
export async function addTextWithShadow(
  buffer: Buffer,
  text: string,
  options: TextOverlayOptions = {}
): Promise<Buffer> {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  console.log(`[text-overlay] Adding text with shadow: "${text}"`)

  const metadata = await sharp(buffer).metadata()
  const width = metadata.width || STICKER_DIMENSIONS.width
  const height = metadata.height || STICKER_DIMENSIONS.height

  const fontFamily = SUPPORTED_FONTS[opts.language] || 'sans-serif'
  const textY = calculateTextY(opts.position, height, opts.fontSize, opts.padding)
  const escapedText = escapeXml(text)
  const shadowOffset = 2

  // Create SVG with shadow layer + main text
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="${shadowOffset}" dy="${shadowOffset}" stdDeviation="2" flood-color="rgba(0,0,0,0.5)"/>
        </filter>
      </defs>
      <style>
        .text {
          font-family: '${fontFamily}', sans-serif;
          font-size: ${opts.fontSize}px;
          font-weight: ${opts.fontWeight};
          fill: ${opts.color};
          stroke: ${opts.outlineColor};
          stroke-width: ${opts.outlineWidth}px;
          paint-order: stroke fill;
          text-anchor: middle;
          dominant-baseline: middle;
          filter: url(#shadow);
        }
      </style>
      <text x="${width / 2}" y="${textY}" class="text">
        ${wrapText(escapedText, opts.maxWidth, opts.fontSize)}
      </text>
    </svg>
  `

  const result = await sharp(buffer)
    .composite([
      {
        input: Buffer.from(svg),
        top: 0,
        left: 0,
      },
    ])
    .png()
    .toBuffer()

  console.log(`[text-overlay] Text with shadow complete`)
  return result
}

/**
 * Create a text-only sticker (transparent background with text)
 *
 * @param text - Text content
 * @param options - Styling options
 * @returns Buffer with text on transparent background
 */
export async function createTextSticker(
  text: string,
  options: TextOverlayOptions & { width?: number; height?: number } = {}
): Promise<Buffer> {
  const width = options.width || STICKER_DIMENSIONS.width
  const height = options.height || STICKER_DIMENSIONS.height
  const opts = { ...DEFAULT_OPTIONS, ...options, position: 'center' as const }

  console.log(`[text-overlay] Creating text-only sticker: "${text}"`)

  const fontFamily = SUPPORTED_FONTS[opts.language] || 'sans-serif'
  const escapedText = escapeXml(text)

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <style>
        .text {
          font-family: '${fontFamily}', sans-serif;
          font-size: ${opts.fontSize}px;
          font-weight: ${opts.fontWeight};
          fill: ${opts.color};
          stroke: ${opts.outlineColor};
          stroke-width: ${opts.outlineWidth}px;
          paint-order: stroke fill;
          text-anchor: middle;
          dominant-baseline: middle;
        }
      </style>
      <text x="${width / 2}" y="${height / 2}" class="text">
        ${wrapText(escapedText, opts.maxWidth, opts.fontSize)}
      </text>
    </svg>
  `

  const result = await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: Buffer.from(svg),
        top: 0,
        left: 0,
      },
    ])
    .png()
    .toBuffer()

  console.log(`[text-overlay] Text sticker created`)
  return result
}

/**
 * Measure approximate text width for a given string
 *
 * @param text - Text to measure
 * @param fontSize - Font size in pixels
 * @returns Estimated width in pixels
 */
export function estimateTextWidth(text: string, fontSize: number): number {
  // Rough estimation based on average character widths
  // CJK characters are typically wider (full-width)
  let width = 0
  for (const char of text) {
    const code = char.charCodeAt(0)
    // CJK ranges: common Chinese/Japanese/Korean characters
    if (
      (code >= 0x4E00 && code <= 0x9FFF) || // CJK Unified Ideographs
      (code >= 0x3040 && code <= 0x309F) || // Hiragana
      (code >= 0x30A0 && code <= 0x30FF) || // Katakana
      (code >= 0xAC00 && code <= 0xD7AF) || // Korean Hangul
      (code >= 0x0E00 && code <= 0x0E7F)    // Thai
    ) {
      width += fontSize // Full-width characters
    } else {
      width += fontSize * 0.6 // Half-width characters
    }
  }
  return width
}

/**
 * Calculate optimal font size to fit text within width
 *
 * @param text - Text to fit
 * @param maxWidth - Maximum width in pixels
 * @param maxFontSize - Maximum font size to use
 * @param minFontSize - Minimum font size to use
 * @returns Optimal font size
 */
export function calculateOptimalFontSize(
  text: string,
  maxWidth: number,
  maxFontSize: number = 48,
  minFontSize: number = 16
): number {
  let fontSize = maxFontSize

  while (fontSize > minFontSize) {
    const width = estimateTextWidth(text, fontSize)
    if (width <= maxWidth) {
      return fontSize
    }
    fontSize -= 2
  }

  return minFontSize
}
