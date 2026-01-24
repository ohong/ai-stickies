import type { Language } from '@/src/types'

/**
 * LINE Sticker Marketplace specifications
 * https://creator.line.me/en/guideline/sticker/
 */
export const LINE_SPECS = {
  sticker: {
    maxWidth: 370,
    maxHeight: 320,
    maxSizeKB: 500,
    format: 'png' as const,
  },
  main: {
    width: 240,
    height: 240,
    maxSizeKB: 1000,
    format: 'png' as const,
  },
  tab: {
    width: 96,
    height: 74,
    maxSizeKB: 1000,
    format: 'png' as const,
  },
  pack: {
    minStickers: 8,
    maxStickers: 40,
    defaultStickers: 10,
  },
} as const

export type LineAssetType = 'sticker' | 'main' | 'tab'

export const SUPPORTED_FONTS: Record<Language, string> = {
  en: 'sans-serif',
  ja: 'Noto Sans JP',
  'zh-TW': 'Noto Sans TC',
  'zh-CN': 'Noto Sans SC',
  th: 'Noto Sans Thai',
  id: 'sans-serif',
  ko: 'Noto Sans KR',
}

/**
 * Generate LINE sticker filenames
 */
export function getStickerFilename(index: number): string {
  // 1-indexed, zero-padded to 2 digits
  return `${String(index + 1).padStart(2, '0')}.png`
}

/**
 * Get all required filenames for a pack
 */
export function getPackFilenames(stickerCount: number): string[] {
  const filenames = ['main.png', 'tab.png']
  for (let i = 0; i < stickerCount; i++) {
    filenames.push(getStickerFilename(i))
  }
  return filenames
}
