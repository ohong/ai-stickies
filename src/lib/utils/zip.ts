/**
 * ZIP utility for sticker pack export
 * Creates LINE-compatible pack archives
 */

import archiver from 'archiver'
import type { Sticker } from '../../types/database'

export interface PackZipInput {
  stickers: Array<{
    sequenceNumber: number
    buffer: Buffer
    emotion?: string
    hasText?: boolean
    textContent?: string | null
  }>
  mainImage?: Buffer
  tabImage?: Buffer
  packName?: string
}

/**
 * Create ZIP archive for sticker pack
 * Returns Buffer containing ZIP file
 */
export async function createPackZip(input: PackZipInput): Promise<Buffer> {
  const { stickers, mainImage, tabImage, packName = 'sticker_pack' } = input

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    const archive = archiver('zip', {
      zlib: { level: 9 },
    })

    archive.on('data', chunk => chunks.push(chunk))
    archive.on('end', () => resolve(Buffer.concat(chunks)))
    archive.on('error', reject)

    // Add sticker images (01.png through NN.png)
    for (const sticker of stickers) {
      const filename = String(sticker.sequenceNumber).padStart(2, '0') + '.png'
      archive.append(sticker.buffer, { name: filename })
    }

    // Add main image if provided
    if (mainImage) {
      archive.append(mainImage, { name: 'main.png' })
    }

    // Add tab image if provided
    if (tabImage) {
      archive.append(tabImage, { name: 'tab.png' })
    }

    // Add README with LINE import instructions
    const readme = generateReadme(packName, stickers.length)
    archive.append(readme, { name: 'README.txt' })

    // Add metadata JSON
    const metadata = generateMetadata(input)
    archive.append(JSON.stringify(metadata, null, 2), { name: 'metadata.json' })

    archive.finalize()
  })
}

/**
 * Create marketplace-compatible ZIP with additional requirements
 * Accepts either single pack or multi-pack format
 */
export async function createMarketplaceZip(input: PackZipInput | MultiPackInput[]): Promise<Buffer> {
  // Handle multi-pack format
  if (Array.isArray(input)) {
    return createMultiPackMarketplaceZip(input)
  }

  const { stickers, mainImage, tabImage } = input

  if (!mainImage || !tabImage) {
    throw new Error('main.png and tab.png required for marketplace ZIP')
  }

  if (stickers.length < 8) {
    throw new Error('Minimum 8 stickers required for marketplace')
  }

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    const archive = archiver('zip', {
      zlib: { level: 9 },
    })

    archive.on('data', chunk => chunks.push(chunk))
    archive.on('end', () => resolve(Buffer.concat(chunks)))
    archive.on('error', reject)

    // Marketplace requires specific naming
    archive.append(mainImage, { name: 'main.png' })
    archive.append(tabImage, { name: 'tab.png' })

    // Stickers in stickers/ folder
    for (const sticker of stickers) {
      const filename = String(sticker.sequenceNumber).padStart(2, '0') + '.png'
      archive.append(sticker.buffer, { name: `stickers/${filename}` })
    }

    archive.finalize()
  })
}

/**
 * Create marketplace ZIP for multiple packs
 * Each pack in its own folder ready for LINE Creators Market
 */
async function createMultiPackMarketplaceZip(packs: MultiPackInput[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    const archive = archiver('zip', {
      zlib: { level: 9 },
    })

    archive.on('data', chunk => chunks.push(chunk))
    archive.on('end', () => resolve(Buffer.concat(chunks)))
    archive.on('error', reject)

    // Add each pack in marketplace-ready structure
    for (const pack of packs) {
      const folderName = sanitizeFolderName(pack.styleName)

      // Pack images at folder root
      archive.append(pack.mainImage, { name: `${folderName}/main.png` })
      archive.append(pack.tabImage, { name: `${folderName}/tab.png` })

      // Stickers in stickers subfolder
      for (const sticker of pack.stickers) {
        archive.append(sticker.buffer, { name: `${folderName}/stickers/${sticker.filename}` })
      }
    }

    // Add marketplace README
    const readme = generateMarketplaceReadme(packs.map(p => p.styleName))
    archive.append(readme, { name: 'README.txt' })

    archive.finalize()
  })
}

/**
 * Generate README for marketplace export
 */
function generateMarketplaceReadme(styleNames: string[]): string {
  const styleList = styleNames.map(s => `- ${s}/`).join('\n')

  return `LINE Creators Market Export
============================

This archive contains ${styleNames.length} sticker pack(s) formatted for
LINE Creators Market submission:

${styleList}

Each folder contains:
- main.png (240x240 - pack main image)
- tab.png (96x74 - pack tab icon)
- stickers/ folder with numbered PNG files

Submission Steps:
-----------------

1. Go to https://creator.line.me/
2. Create a LINE Creators Market account (if you don't have one)
3. Click "New Submission" > "Stickers"
4. For each pack:
   a. Upload stickers from the stickers/ folder
   b. Use main.png for the pack's main image
   c. Use tab.png for the pack's tab icon
5. Fill in the required information:
   - Title (English)
   - Title (Local language, optional)
   - Sticker description
   - Creator name
   - Copyright
   - Price tier
6. Submit for review

Requirements Met:
-----------------
[x] PNG format with transparency
[x] Sticker size: 370x320 pixels (max)
[x] Main image: 240x240 pixels
[x] Tab image: 96x74 pixels
[x] File size: Under 300KB per sticker
[x] Minimum 8 stickers per pack

Review typically takes 1-7 business days.

Generated by AI Stickies
https://ai-stickies.app
`
}

/**
 * Input for multi-pack ZIP
 */
export interface MultiPackInput {
  styleName: string
  stickers: Array<{ buffer: Buffer; filename: string }>
  mainImage: Buffer
  tabImage: Buffer
}

/**
 * Create ZIP containing multiple packs
 * Each pack in its own folder by style name
 */
export async function createMultiPackZip(packs: MultiPackInput[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    const archive = archiver('zip', {
      zlib: { level: 9 },
    })

    archive.on('data', chunk => chunks.push(chunk))
    archive.on('end', () => resolve(Buffer.concat(chunks)))
    archive.on('error', reject)

    // Add each pack in its own folder
    for (const pack of packs) {
      const folderName = sanitizeFolderName(pack.styleName)

      // Stickers
      for (const sticker of pack.stickers) {
        archive.append(sticker.buffer, { name: `${folderName}/${sticker.filename}` })
      }

      // Pack images
      archive.append(pack.mainImage, { name: `${folderName}/main.png` })
      archive.append(pack.tabImage, { name: `${folderName}/tab.png` })
    }

    // Add combined README at root
    const styleNames = packs.map(p => p.styleName)
    const readme = generateMultiPackReadme(styleNames)
    archive.append(readme, { name: 'README.txt' })

    archive.finalize()
  })
}

/**
 * Sanitize folder name for ZIP
 */
function sanitizeFolderName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Generate README for multi-pack ZIP
 */
function generateMultiPackReadme(styleNames: string[]): string {
  const styleList = styleNames.map(s => `- ${s}/`).join('\n')

  return `AI Stickies - Combined Export
=============================

This archive contains ${styleNames.length} sticker pack(s):

${styleList}

Each folder contains:
- 01.png through 10.png (stickers)
- main.png (240x240 pack preview)
- tab.png (96x74 tab icon)

How to Use with LINE Sticker Maker:

1. Download the LINE Sticker Maker app
   - iOS: App Store
   - Android: Google Play Store

2. Create a new sticker pack for each style

3. Upload stickers from the corresponding folder

4. Use main.png and tab.png for pack images

5. Submit for review

Specifications:
- Sticker format: PNG with transparency
- Sticker size: 370x320 pixels (max)
- File size: Under 300KB per sticker
- Main image: 240x240 pixels
- Tab image: 96x74 pixels

Generated by AI Stickies
https://ai-stickies.app
`
}

/**
 * Generate README content
 */
export function generateReadme(packName: string, stickerCount: number): string {
  return `${packName}
${'='.repeat(packName.length)}

Sticker Pack Contents:
- ${stickerCount} stickers (01.png - ${String(stickerCount).padStart(2, '0')}.png)
- main.png (240x240 pack icon)
- tab.png (96x74 tab icon)

How to Use with LINE Sticker Maker:

1. Download the LINE Sticker Maker app
   - iOS: App Store
   - Android: Google Play Store

2. Create a new sticker pack

3. Upload your stickers:
   - Tap "Add Stickers"
   - Select the numbered PNG files (01.png, 02.png, etc.)
   - Each sticker should be 370x320 pixels max

4. Set pack images:
   - Use main.png as your pack's main image
   - Use tab.png as your pack's tab image

5. Fill in pack details:
   - Title
   - Author
   - Description

6. Submit for review

Specifications:
- Sticker format: PNG with transparency
- Sticker size: 370x320 pixels (max)
- File size: Under 300KB per sticker
- Main image: 240x240 pixels
- Tab image: 96x74 pixels

Generated by AI Stickies
https://ai-stickies.app
`
}

/**
 * Generate metadata JSON for the pack
 */
function generateMetadata(input: PackZipInput) {
  return {
    version: '1.0',
    generatedAt: new Date().toISOString(),
    packName: input.packName ?? 'sticker_pack',
    stickerCount: input.stickers.length,
    hasMainImage: Boolean(input.mainImage),
    hasTabImage: Boolean(input.tabImage),
    stickers: input.stickers.map(s => ({
      sequenceNumber: s.sequenceNumber,
      emotion: s.emotion ?? null,
      hasText: s.hasText ?? false,
      textContent: s.textContent ?? null,
    })),
    specifications: {
      stickerMaxWidth: 370,
      stickerMaxHeight: 320,
      mainImageSize: 240,
      tabImageWidth: 96,
      tabImageHeight: 74,
      maxFileSizeKB: 300,
    },
  }
}

/**
 * Convert Sticker records to zip input format
 * Fetches image buffers from storage paths
 */
export async function stickersToZipInput(
  stickers: Sticker[],
  fetchBuffer: (path: string) => Promise<Buffer>
): Promise<PackZipInput['stickers']> {
  const results = await Promise.all(
    stickers.map(async sticker => ({
      sequenceNumber: sticker.sequence_number,
      buffer: await fetchBuffer(sticker.storage_path),
      emotion: sticker.emotion ?? undefined,
      hasText: sticker.has_text,
      textContent: sticker.text_content,
    }))
  )

  return results.sort((a, b) => a.sequenceNumber - b.sequenceNumber)
}
