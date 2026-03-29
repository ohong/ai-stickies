/**
 * iMessage sticker export service
 * Resizes stickers to 618x618 max, keeps PNG format
 */

import sharp from 'sharp'
import { IMESSAGE_SPECS } from '@/src/constants/imessage-specs'
import { getBufferSizeKB } from '@/src/lib/utils/image'

export interface StickerInput {
  buffer: Buffer
  sequenceNumber: number
  emotion?: string
}

export interface ProcessedSticker {
  buffer: Buffer
  filename: string
  sequenceNumber: number
}

export async function processForIMessage(stickers: StickerInput[]): Promise<ProcessedSticker[]> {
  const { width, height, maxSizeKB } = IMESSAGE_SPECS.sticker

  const results = await Promise.all(
    stickers.map(async (sticker) => {
      let buffer = await sharp(sticker.buffer)
        .resize({
          width,
          height,
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .ensureAlpha()
        .png({ compressionLevel: 9 })
        .toBuffer()

      // Compress if over size limit
      if (getBufferSizeKB(buffer) > maxSizeKB) {
        buffer = await sharp(sticker.buffer)
          .resize({
            width,
            height,
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          })
          .ensureAlpha()
          .png({ compressionLevel: 9, palette: true, colors: 256 })
          .toBuffer()
      }

      return {
        buffer,
        filename: `${String(sticker.sequenceNumber).padStart(2, '0')}.png`,
        sequenceNumber: sticker.sequenceNumber,
      }
    })
  )

  return results.sort((a, b) => a.sequenceNumber - b.sequenceNumber)
}
