/**
 * Telegram sticker export service
 * Converts stickers to 512x512 WebP, max 256KB each
 */

import { TELEGRAM_SPECS } from '@/src/constants/telegram-specs'
import { convertToWebP } from '../image-processing.service'

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

export async function processForTelegram(stickers: StickerInput[]): Promise<ProcessedSticker[]> {
  const { width, height, maxSizeKB } = TELEGRAM_SPECS.sticker

  const results = await Promise.all(
    stickers.map(async (sticker) => {
      const buffer = await convertToWebP(sticker.buffer, maxSizeKB, width, height)
      return {
        buffer,
        filename: `${String(sticker.sequenceNumber).padStart(2, '0')}.webp`,
        sequenceNumber: sticker.sequenceNumber,
      }
    })
  )

  return results.sort((a, b) => a.sequenceNumber - b.sequenceNumber)
}
