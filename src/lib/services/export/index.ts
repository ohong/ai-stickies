/**
 * Unified multi-platform export service
 */

import type { Platform } from '@/src/constants/platform-specs'
import { processForWhatsApp } from './whatsapp-export.service'
import { processForTelegram } from './telegram-export.service'
import { processForIMessage } from './imessage-export.service'
import { processForLine } from '../image-processing.service'
import { createPlatformZip } from '@/src/lib/utils/zip'

export interface StickerData {
  buffer: Buffer
  sequenceNumber: number
  emotion?: string
}

export interface ProcessedSticker {
  buffer: Buffer
  filename: string
  sequenceNumber: number
}

/**
 * Process stickers for a given platform and return a ZIP buffer
 */
export async function exportForPlatform(
  platform: Platform,
  stickers: StickerData[],
  packName?: string
): Promise<Buffer> {
  let processed: ProcessedSticker[]

  switch (platform) {
    case 'whatsapp':
      processed = await processForWhatsApp(stickers)
      break
    case 'telegram':
      processed = await processForTelegram(stickers)
      break
    case 'imessage':
      processed = await processForIMessage(stickers)
      break
    case 'line':
      processed = await Promise.all(
        stickers.map(async (s) => ({
          buffer: await processForLine(s.buffer),
          filename: `${String(s.sequenceNumber).padStart(2, '0')}.png`,
          sequenceNumber: s.sequenceNumber,
        }))
      )
      break
    default:
      throw new Error(`Unsupported platform: ${platform}`)
  }

  return createPlatformZip(platform, processed, packName)
}

export { processForWhatsApp } from './whatsapp-export.service'
export { processForTelegram } from './telegram-export.service'
export { processForIMessage } from './imessage-export.service'
