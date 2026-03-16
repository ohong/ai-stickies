/**
 * Unified platform spec interface and registry
 */

import { LINE_SPECS } from './line-specs'
import { WHATSAPP_SPECS } from './whatsapp-specs'
import { TELEGRAM_SPECS } from './telegram-specs'
import { IMESSAGE_SPECS } from './imessage-specs'

export type Platform = 'line' | 'whatsapp' | 'telegram' | 'imessage'

export interface PlatformSpec {
  name: string
  sticker: {
    width: number
    height: number
    maxSizeKB: number
    format: 'png' | 'webp'
  }
  pack: {
    minStickers: number
    maxStickers: number
  }
}

export const PLATFORM_SPECS: Record<Platform, PlatformSpec> = {
  line: {
    name: 'LINE',
    sticker: {
      width: LINE_SPECS.sticker.maxWidth,
      height: LINE_SPECS.sticker.maxHeight,
      maxSizeKB: LINE_SPECS.sticker.maxSizeKB,
      format: 'png',
    },
    pack: LINE_SPECS.pack,
  },
  whatsapp: {
    name: 'WhatsApp',
    sticker: WHATSAPP_SPECS.sticker,
    pack: WHATSAPP_SPECS.pack,
  },
  telegram: {
    name: 'Telegram',
    sticker: TELEGRAM_SPECS.sticker,
    pack: TELEGRAM_SPECS.pack,
  },
  imessage: {
    name: 'iMessage',
    sticker: {
      width: IMESSAGE_SPECS.sticker.width,
      height: IMESSAGE_SPECS.sticker.height,
      maxSizeKB: IMESSAGE_SPECS.sticker.maxSizeKB,
      format: 'png',
    },
    pack: IMESSAGE_SPECS.pack,
  },
} as const

export const PLATFORMS: Platform[] = ['line', 'whatsapp', 'telegram', 'imessage']

export { LINE_SPECS } from './line-specs'
export { WHATSAPP_SPECS } from './whatsapp-specs'
export { TELEGRAM_SPECS } from './telegram-specs'
export { IMESSAGE_SPECS } from './imessage-specs'
