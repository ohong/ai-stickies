/**
 * iMessage Sticker specifications
 * https://developer.apple.com/documentation/messages/creating-stickers-with-imessage
 */
export const IMESSAGE_SPECS = {
  sticker: {
    minWidth: 300,
    minHeight: 300,
    maxWidth: 618,
    maxHeight: 618,
    width: 618,
    height: 618,
    maxSizeKB: 500,
    format: 'png' as const,
  },
  pack: {
    minStickers: 1,
    maxStickers: 100,
  },
} as const

export function getIMessageStickerFilename(index: number): string {
  return `${String(index + 1).padStart(2, '0')}.png`
}
