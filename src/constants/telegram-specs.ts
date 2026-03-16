/**
 * Telegram Sticker specifications
 * https://core.telegram.org/stickers
 */
export const TELEGRAM_SPECS = {
  sticker: {
    width: 512,
    height: 512,
    maxSizeKB: 256,
    format: 'webp' as const,
  },
  pack: {
    minStickers: 1,
    maxStickers: 120,
  },
} as const

export function getTelegramStickerFilename(index: number): string {
  return `${String(index + 1).padStart(2, '0')}.webp`
}
