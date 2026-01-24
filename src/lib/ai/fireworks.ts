/**
 * Fireworks AI for LLM prompt generation
 * Uses OpenAI-compatible chat completions API
 */

import { aiConfig } from '../config'
import type { StyleConfig, Language, EmotionConfig } from '../../types'

const FIREWORKS_API_BASE = 'https://api.fireworks.ai/inference/v1'
const MODEL = 'accounts/fireworks/models/llama-v3p1-70b-instruct'

export interface StickerPrompt {
  emotion: string
  scene: string
  promptText: string
  hasText: boolean
  textContent: string | null
}

export interface PromptGenerationInput {
  styleConfig: StyleConfig
  personalContext?: string
  language: Language
  emotionsList: EmotionConfig[]
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatCompletionResponse {
  id: string
  choices: Array<{
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export class FireworksError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message)
    this.name = 'FireworksError'
  }
}

/**
 * Send chat completion request to Fireworks API
 */
export async function chatCompletion(
  messages: ChatMessage[],
  options?: {
    temperature?: number
    maxTokens?: number
  }
): Promise<string> {
  if (!aiConfig.fireworksApiKey) {
    throw new FireworksError('Fireworks API key not configured', 'NO_API_KEY')
  }

  const response = await fetch(`${FIREWORKS_API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${aiConfig.fireworksApiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2048,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new FireworksError(
      `Fireworks API error: ${errorText}`,
      'API_ERROR',
      response.status
    )
  }

  const data = (await response.json()) as ChatCompletionResponse

  if (!data.choices?.[0]?.message?.content) {
    throw new FireworksError('No content in response', 'NO_CONTENT')
  }

  return data.choices[0].message.content
}

/**
 * Generate sticker prompts for a pack
 */
export async function generateStickerPrompts(
  input: PromptGenerationInput
): Promise<StickerPrompt[]> {
  const { styleConfig, personalContext, language, emotionsList } = input

  const systemPrompt = buildSystemPrompt()
  const userPrompt = buildStickerPromptsUserMessage(
    styleConfig,
    emotionsList,
    language,
    personalContext
  )

  const response = await chatCompletion([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ])

  return parseStickerPrompts(response)
}

/**
 * Generate a preview prompt for style testing
 */
export async function generatePreviewPrompt(
  styleConfig: StyleConfig,
  photoDescription: string,
  personalContext?: string
): Promise<string> {
  const systemPrompt = buildSystemPrompt()
  const userPrompt = buildPreviewPromptUserMessage(
    styleConfig,
    photoDescription,
    personalContext
  )

  const response = await chatCompletion([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ])

  // Extract just the prompt from response
  return cleanPromptResponse(response)
}

function buildSystemPrompt(): string {
  return `You are an expert LINE sticker prompt engineer. Your job is to create detailed,
effective image generation prompts for LINE stickers.

Guidelines:
- Prompts should be specific and descriptive
- Focus on emotion, pose, and visual elements
- Include style-specific modifiers
- Keep backgrounds simple or transparent
- Optimize for 370x320px sticker format
- Make characters expressive and readable at small sizes`
}

function buildPreviewPromptUserMessage(
  styleConfig: StyleConfig,
  photoDescription: string,
  personalContext?: string
): string {
  const styleModifiers = styleConfig.promptModifiers.join(', ')

  return `Create a single image generation prompt for a ${styleConfig.name} style LINE sticker.

Style: ${styleConfig.name}
Style modifiers: ${styleModifiers}
Character description: ${photoDescription}
${personalContext ? `Personal context: ${personalContext}` : ''}

Generate a prompt for a friendly, neutral expression sticker that showcases this style.
The prompt should be a single paragraph, ready to use with an image generation model.
Only output the prompt itself, no explanation.`
}

function buildStickerPromptsUserMessage(
  styleConfig: StyleConfig,
  emotions: EmotionConfig[],
  language: Language,
  personalContext?: string
): string {
  const styleModifiers = styleConfig.promptModifiers.join(', ')
  const emotionList = emotions
    .map(e => `- ${e.id}: ${e.promptHint}`)
    .join('\n')

  const textLanguage = getLanguageName(language)

  return `Generate LINE sticker prompts for a pack of ${emotions.length} stickers.

Style: ${styleConfig.name}
Style modifiers: ${styleModifiers}
${personalContext ? `Character context: ${personalContext}` : ''}

Emotions to cover (one per sticker):
${emotionList}

Text language: ${textLanguage}
Text guidelines:
- About 60% of stickers should be graphics-only (no text)
- About 40% can include short text (1-3 words max)
- Text must be in ${textLanguage}
- Text should match the emotion

For each sticker, output in this exact JSON format:
[
  {
    "emotion": "happy",
    "scene": "brief scene description",
    "promptText": "full image generation prompt",
    "hasText": false,
    "textContent": null
  },
  ...
]

Only output the JSON array, no explanation.`
}

function getLanguageName(language: Language): string {
  const names: Record<Language, string> = {
    en: 'English',
    ja: 'Japanese',
    'zh-TW': 'Traditional Chinese',
    'zh-CN': 'Simplified Chinese',
    th: 'Thai',
    id: 'Indonesian',
    ko: 'Korean',
  }
  return names[language] ?? 'English'
}

function parseStickerPrompts(response: string): StickerPrompt[] {
  // Try to extract JSON from response
  const jsonMatch = response.match(/\[[\s\S]*\]/)
  if (!jsonMatch) {
    throw new FireworksError('Could not parse sticker prompts', 'PARSE_ERROR')
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]) as StickerPrompt[]

    // Validate structure
    if (!Array.isArray(parsed)) {
      throw new Error('Response is not an array')
    }

    return parsed.map(p => ({
      emotion: String(p.emotion ?? 'unknown'),
      scene: String(p.scene ?? ''),
      promptText: String(p.promptText ?? ''),
      hasText: Boolean(p.hasText),
      textContent: p.textContent ? String(p.textContent) : null,
    }))
  } catch (error) {
    throw new FireworksError(
      `Failed to parse prompts: ${error instanceof Error ? error.message : 'Unknown'}`,
      'PARSE_ERROR'
    )
  }
}

function cleanPromptResponse(response: string): string {
  // Remove any markdown formatting or extra explanation
  return response
    .replace(/```[\s\S]*?```/g, '')
    .replace(/^["']|["']$/g, '')
    .trim()
    .split('\n')[0] // Take first line if multiple
    .trim()
}

/**
 * Check if Fireworks is available
 */
export function isFireworksAvailable(): boolean {
  return Boolean(aiConfig.fireworksApiKey)
}

/**
 * Retry wrapper for prompt generation
 */
export async function generateStickerPromptsWithRetry(
  input: PromptGenerationInput,
  maxRetries = 3
): Promise<StickerPrompt[]> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await generateStickerPrompts(input)
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')

      // Don't retry on config errors
      if (error instanceof FireworksError && error.code === 'NO_API_KEY') {
        throw error
      }

      // Exponential backoff
      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError ?? new FireworksError('Prompt generation failed', 'MAX_RETRIES')
}
