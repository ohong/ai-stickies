/**
 * Prompt service for generating sticker prompts
 * Uses Fireworks AI LLM for intelligent prompt generation
 */

import { generatePreviewPrompt as fireworksPreviewPrompt, generateStickerPromptsWithRetry } from '../ai/fireworks'
import { EMOTIONS, getEmotionById } from '../../constants/emotions'
import { getStyleConfig, buildStylePrompt } from '../../constants/styles'
import {
  STICKER_BASE_REQUIREMENTS,
  STYLE_PROMPT_ADDITIONS,
  TEXT_EXAMPLES,
} from '../../constants/prompts'
import type { StyleConfig, Language, FidelityLevel, EmotionConfig } from '../../types'
import type { StickerPrompt } from '../ai/fireworks'

export interface PreviewPromptInput {
  style: FidelityLevel
  photoDescription: string
  personalContext?: string
}

export interface StickerPackPromptsInput {
  style: FidelityLevel
  characterDescription: string
  language: Language
  personalContext?: string
  count?: number
  customEmotions?: string[] // emotion IDs to use, defaults to mixed selection
}

export interface GeneratedStickerPrompt {
  emotion: string
  emotionEmoji: string
  scene: string
  fullPrompt: string
  hasText: boolean
  textContent: string | null
}

/**
 * Generate a preview prompt for style testing
 * Uses Fireworks LLM for intelligent prompt generation
 */
export async function generatePreviewPrompt(
  input: PreviewPromptInput
): Promise<string> {
  const styleConfig = getStyleConfig(input.style)

  try {
    const prompt = await fireworksPreviewPrompt(
      styleConfig,
      input.photoDescription,
      input.personalContext
    )
    return prompt
  } catch (error) {
    // Fallback to template-based prompt
    console.warn('Fireworks prompt generation failed, using fallback:', error)
    return buildFallbackPreviewPrompt(styleConfig, input.photoDescription, input.personalContext)
  }
}

/**
 * Generate a simple preview prompt without LLM
 * Faster but less creative
 */
export function generateSimplePreviewPrompt(input: PreviewPromptInput): string {
  const styleConfig = getStyleConfig(input.style)
  return buildFallbackPreviewPrompt(styleConfig, input.photoDescription, input.personalContext)
}

/**
 * Generate prompts for a full sticker pack
 * Uses Fireworks LLM for diverse, creative prompts
 */
export async function generateStickerPackPrompts(
  input: StickerPackPromptsInput
): Promise<GeneratedStickerPrompt[]> {
  const styleConfig = getStyleConfig(input.style)
  const count = input.count ?? 8
  const emotions = selectEmotions(count, input.customEmotions)

  try {
    const prompts = await generateStickerPromptsWithRetry({
      styleConfig,
      personalContext: input.personalContext,
      language: input.language,
      emotionsList: emotions,
    })

    return prompts.map(p => enrichPrompt(p, styleConfig))
  } catch (error) {
    // Fallback to template-based prompts
    console.warn('Fireworks prompt generation failed, using fallback:', error)
    return generateFallbackPackPrompts(styleConfig, emotions, input.language, input.characterDescription)
  }
}

/**
 * Generate prompts without LLM (faster but less creative)
 */
export function generateSimplePackPrompts(
  input: StickerPackPromptsInput
): GeneratedStickerPrompt[] {
  const styleConfig = getStyleConfig(input.style)
  const count = input.count ?? 8
  const emotions = selectEmotions(count, input.customEmotions)

  return generateFallbackPackPrompts(
    styleConfig,
    emotions,
    input.language,
    input.characterDescription
  )
}

/**
 * Select emotions for a pack, mixing from available options
 */
function selectEmotions(count: number, customIds?: string[]): EmotionConfig[] {
  if (customIds && customIds.length > 0) {
    return customIds
      .map(id => getEmotionById(id))
      .filter((e): e is EmotionConfig => e !== undefined)
      .slice(0, count)
  }

  // Default selection prioritizes common emotions
  const priorityOrder = [
    'happy', 'thanks', 'love', 'ok', 'sad',
    'excited', 'sorry', 'thinking', 'tired',
    'surprised', 'angry', 'laughing',
  ]

  const selected: EmotionConfig[] = []
  for (const id of priorityOrder) {
    if (selected.length >= count) break
    const emotion = getEmotionById(id)
    if (emotion) selected.push(emotion)
  }

  return selected
}

/**
 * Enrich LLM-generated prompt with additional style details
 */
function enrichPrompt(
  prompt: StickerPrompt,
  styleConfig: StyleConfig
): GeneratedStickerPrompt {
  const emotion = getEmotionById(prompt.emotion)
  const styleAddition = STYLE_PROMPT_ADDITIONS[styleConfig.id] ?? ''

  // Build full prompt with style additions
  const fullPrompt = `${prompt.promptText} ${styleAddition}${STICKER_BASE_REQUIREMENTS}`

  return {
    emotion: prompt.emotion,
    emotionEmoji: emotion?.emoji ?? '',
    scene: prompt.scene,
    fullPrompt,
    hasText: prompt.hasText,
    textContent: prompt.textContent,
  }
}

/**
 * Build fallback preview prompt without LLM
 */
function buildFallbackPreviewPrompt(
  styleConfig: StyleConfig,
  photoDescription: string,
  personalContext?: string
): string {
  const base = `LINE sticker of ${photoDescription}`
  const context = personalContext ? `, ${personalContext}` : ''
  const styleAddition = STYLE_PROMPT_ADDITIONS[styleConfig.id] ?? ''

  return buildStylePrompt(
    styleConfig.id,
    `${base}${context}, friendly neutral expression, facing forward, ${styleAddition}${STICKER_BASE_REQUIREMENTS}`
  )
}

/**
 * Generate fallback pack prompts without LLM
 */
function generateFallbackPackPrompts(
  styleConfig: StyleConfig,
  emotions: EmotionConfig[],
  language: Language,
  characterDescription: string
): GeneratedStickerPrompt[] {
  const textExamples = TEXT_EXAMPLES[language] ?? TEXT_EXAMPLES.en

  return emotions.map((emotion, index) => {
    // ~40% should have text
    const hasText = index % 3 === 0
    const textContent = hasText
      ? emotion.suggestedText[language] ?? textExamples[index % textExamples.length]
      : null

    const promptBase = `LINE sticker of ${characterDescription}, ${emotion.promptHint}`
    const styleAddition = STYLE_PROMPT_ADDITIONS[styleConfig.id] ?? ''
    const textPart = hasText ? `, with text "${textContent}"` : ''

    const fullPrompt = buildStylePrompt(
      styleConfig.id,
      `${promptBase}${textPart}, ${styleAddition}${STICKER_BASE_REQUIREMENTS}`
    )

    return {
      emotion: emotion.id,
      emotionEmoji: emotion.emoji,
      scene: emotion.promptHint,
      fullPrompt,
      hasText,
      textContent,
    }
  })
}

/**
 * Validate prompt for image generation
 */
export function validatePrompt(prompt: string): { valid: boolean; error?: string } {
  if (!prompt || prompt.trim().length === 0) {
    return { valid: false, error: 'Prompt is empty' }
  }

  if (prompt.length < 10) {
    return { valid: false, error: 'Prompt too short' }
  }

  if (prompt.length > 2000) {
    return { valid: false, error: 'Prompt too long (max 2000 chars)' }
  }

  return { valid: true }
}
