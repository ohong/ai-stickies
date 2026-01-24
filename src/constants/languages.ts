import type { Language } from '@/src/types'

export interface LanguageConfig {
  code: Language
  label: string
  nativeLabel: string
  locale: string
}

export const LANGUAGES: Record<Language, LanguageConfig> = {
  en: {
    code: 'en',
    label: 'English',
    nativeLabel: 'English',
    locale: 'en-US',
  },
  ja: {
    code: 'ja',
    label: 'Japanese',
    nativeLabel: '日本語',
    locale: 'ja-JP',
  },
  'zh-TW': {
    code: 'zh-TW',
    label: 'Traditional Chinese',
    nativeLabel: '繁體中文',
    locale: 'zh-TW',
  },
  'zh-CN': {
    code: 'zh-CN',
    label: 'Simplified Chinese',
    nativeLabel: '简体中文',
    locale: 'zh-CN',
  },
  th: {
    code: 'th',
    label: 'Thai',
    nativeLabel: 'ไทย',
    locale: 'th-TH',
  },
  id: {
    code: 'id',
    label: 'Indonesian',
    nativeLabel: 'Bahasa Indonesia',
    locale: 'id-ID',
  },
  ko: {
    code: 'ko',
    label: 'Korean',
    nativeLabel: '한국어',
    locale: 'ko-KR',
  },
}

export const LANGUAGE_CODES: Language[] = Object.keys(LANGUAGES) as Language[]

export const DEFAULT_LANGUAGE: Language = 'en'

export function getLanguageConfig(code: Language): LanguageConfig {
  return LANGUAGES[code]
}

export function isValidLanguage(code: string): code is Language {
  return code in LANGUAGES
}
