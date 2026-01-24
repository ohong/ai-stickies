import type { StyleConfig, FidelityLevel } from '../types'

export const STYLES: Record<FidelityLevel, StyleConfig> = {
  high: {
    id: 'high',
    name: 'High Fidelity',
    description: 'Detailed, realistic representation maintaining facial features',
    promptModifiers: [
      'highly detailed',
      'realistic proportions',
      'accurate facial features',
      'professional quality',
      'clean lines',
      'vibrant colors',
    ],
    textStyle: {
      font: 'Rounded Mplus 1c Bold',
      color: '#FFFFFF',
      strokeColor: '#000000',
      strokeWidth: 3,
      position: 'bottom',
      maxLength: 12,
    },
    exampleEmoji: '🎨',
  },
  stylized: {
    id: 'stylized',
    name: 'Stylized',
    description: 'Artistic interpretation with expressive features',
    promptModifiers: [
      'stylized illustration',
      'expressive features',
      'dynamic poses',
      'artistic flair',
      'bold outlines',
      'saturated colors',
    ],
    textStyle: {
      font: 'M PLUS Rounded 1c',
      color: '#FFFFFF',
      strokeColor: '#333333',
      strokeWidth: 2,
      position: 'bottom',
      maxLength: 15,
    },
    exampleEmoji: '✨',
  },
  abstract: {
    id: 'abstract',
    name: 'Abstract',
    description: 'Simplified forms with artistic interpretation',
    promptModifiers: [
      'abstract art style',
      'simplified shapes',
      'geometric forms',
      'modern art',
      'flat design',
      'bold colors',
    ],
    textStyle: {
      font: 'Noto Sans',
      color: '#FFFFFF',
      strokeColor: '#222222',
      strokeWidth: 2,
      position: 'center',
      maxLength: 10,
    },
    exampleEmoji: '🔷',
  },
  chibi: {
    id: 'chibi',
    name: 'Chibi',
    description: 'Cute, super-deformed style with big head and small body',
    promptModifiers: [
      'chibi style',
      'big head small body',
      'kawaii',
      'cute expressions',
      'rounded features',
      'pastel colors',
      'anime inspired',
    ],
    textStyle: {
      font: 'Kosugi Maru',
      color: '#FFFFFF',
      strokeColor: '#FF69B4',
      strokeWidth: 2,
      position: 'top',
      maxLength: 8,
    },
    exampleEmoji: '🥺',
  },
  minimalist: {
    id: 'minimalist',
    name: 'Minimalist',
    description: 'Clean, simple design with essential features only',
    promptModifiers: [
      'minimalist style',
      'simple lines',
      'essential features only',
      'clean design',
      'white space',
      'monochrome accent',
    ],
    textStyle: {
      font: 'Inter',
      color: '#333333',
      strokeColor: '#FFFFFF',
      strokeWidth: 1,
      position: 'bottom',
      maxLength: 20,
    },
    exampleEmoji: '⬜',
  },
}

export const STYLE_ORDER: FidelityLevel[] = [
  'chibi',
  'abstract',
  'minimalist',
  'stylized',
  'high',
]

export function getStyleConfig(level: FidelityLevel): StyleConfig {
  return STYLES[level]
}

export function buildStylePrompt(level: FidelityLevel, basePrompt: string): string {
  const style = STYLES[level]
  const modifiers = style.promptModifiers.join(', ')
  return `${basePrompt}, ${modifiers}`
}
