/**
 * WhatsApp Sticker specifications
 * https://github.com/nicedoc/whatsapp-sticker-specs
 */
export const WHATSAPP_SPECS = {
  sticker: {
    width: 512,
    height: 512,
    maxSizeKB: 100,
    format: 'webp' as const,
  },
  pack: {
    minStickers: 3,
    maxStickers: 30,
  },
} as const

export function getWhatsAppStickerFilename(index: number): string {
  return `${String(index + 1).padStart(2, '0')}.webp`
}
