#!/usr/bin/env bun
/**
 * Estimate the "fully loaded" cost to generate a sticker pack.
 *
 * Covers every billable API call in the pipeline:
 *   1. Style previews  – simple template prompts (no LLM) + image gen
 *   2. Pack prompts     – 1 LLM call via Fireworks (Kimi K2.5)
 *   3. Sticker images   – N image gen calls via Fal.ai (nano-banana-2)
 *
 * Pricing (as of 2026-03-12):
 *   Fireworks Kimi K2.5  – $0.60 / 1M input tokens, $3.00 / 1M output tokens
 *   Fal nano-banana-2    – $0.08 / image (standard resolution)
 */

// ─── Pricing constants ───────────────────────────────────────────────────────

const FIREWORKS_INPUT_PER_M = 0.60 // $/1M input tokens
const FIREWORKS_OUTPUT_PER_M = 3.00 // $/1M output tokens
const FAL_PER_IMAGE = 0.06 // $/image (0.5K resolution = 0.75× standard $0.08)

// ─── Pipeline parameters ─────────────────────────────────────────────────────

const STICKERS_PER_PACK = 10
const STYLE_PREVIEWS = 5 // generated before pack selection
const LLM_CALLS_PER_PACK = 1 // one call generates all 10 prompts

// ─── Token estimation ────────────────────────────────────────────────────────
// Rough estimates based on the actual prompt templates in the codebase.
// ~4 characters per token for English text.

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

// Reproduce the prompts to measure them accurately
const systemPrompt = `You are an expert LINE sticker prompt engineer. Your job is to create detailed,
effective image generation prompts that comply with LINE Creator Guidelines.

LINE Sticker Requirements (mandatory):
- Transparent background (required for LINE stickers)
- 370x320px format with 10px margin from edges
- Designs suited for daily messaging conversations
- Clear, easily understood expressions
- Character centered and filling the frame
- Upper body or face close-up preferred (avoid tiny full-body figures)
- Bold outlines for visibility at small chat sizes
- No logos, brands, or promotional content

Prompt Guidelines:
- Be specific and descriptive
- Focus on emotion, pose, and visual elements
- Include style-specific modifiers
- Always specify transparent background`

// Representative user prompt for a 10-sticker pack
const sampleUserPrompt = `Generate LINE sticker prompts for a pack of 10 stickers.

Style: Chibi
Style modifiers: cute chibi style, exaggerated big head, kawaii aesthetics, rounded features, soft pastel colors, anime-inspired
Character context: a cheerful orange tabby cat

Emotions to cover (one per sticker):
- happy: smiling brightly, eyes sparkling with joy
- thanks: grateful bow or heart gesture
- love: hearts floating, blushing cheeks
- ok: thumbs up, confident wink
- sad: teary eyes, drooping expression
- excited: jumping with arms raised
- sorry: apologetic bow, sweat drop
- thinking: hand on chin, contemplative look
- tired: sleepy eyes, yawning
- surprised: wide eyes, open mouth

Text language: English
Text guidelines:
- About 60% of stickers should be graphics-only (no text)
- About 40% can include short text (1-3 words max)
- Text must be in English
- Text should match the emotion

Image guidelines (LINE requirements):
- ALWAYS specify transparent background
- Character centered, upper body or face close-up (avoid tiny full-body)
- 10px margin from edges
- Bold outlines for small chat visibility
- Suited for daily messaging conversations

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

// Representative LLM output (~10 sticker prompts as JSON)
const sampleOutputPerSticker = `{
    "emotion": "happy",
    "scene": "Cat grinning with sparkles around face",
    "promptText": "Cute chibi orange tabby cat LINE sticker, smiling brightly with eyes sparkling with joy, kawaii style with exaggerated big head and small body, soft pastel colors, rounded features, anime-inspired, hearts and sparkle effects around the character, upper body close-up centered in frame, bold outlines for small-size visibility, transparent background, 370x320px with 10px margin",
    "hasText": false,
    "textContent": null
  }`

// ─── Calculate ───────────────────────────────────────────────────────────────

const inputTokens = estimateTokens(systemPrompt) + estimateTokens(sampleUserPrompt)
const outputTokens = estimateTokens(sampleOutputPerSticker) * STICKERS_PER_PACK

const llmInputCost = (inputTokens / 1_000_000) * FIREWORKS_INPUT_PER_M
const llmOutputCost = (outputTokens / 1_000_000) * FIREWORKS_OUTPUT_PER_M
const llmTotalCost = llmInputCost + llmOutputCost

const packImageCost = STICKERS_PER_PACK * FAL_PER_IMAGE
const previewImageCost = STYLE_PREVIEWS * FAL_PER_IMAGE

const packOnlyCost = llmTotalCost + packImageCost
const fullyLoadedCost = llmTotalCost + packImageCost + previewImageCost

// ─── Output ──────────────────────────────────────────────────────────────────

console.log('═══════════════════════════════════════════════════════════════')
console.log('  Sticker Pack Cost Estimate')
console.log('  Fireworks (Kimi K2.5) + Fal.ai (nano-banana-2)')
console.log('═══════════════════════════════════════════════════════════════')
console.log()

console.log('── Pricing ─────────────────────────────────────────────────')
console.log(`  Fireworks Kimi K2.5  : $${FIREWORKS_INPUT_PER_M.toFixed(2)}/1M input, $${FIREWORKS_OUTPUT_PER_M.toFixed(2)}/1M output`)
console.log(`  Fal nano-banana-2    : $${FAL_PER_IMAGE.toFixed(2)}/image`)
console.log()

console.log('── LLM: Prompt Generation (1 call per pack) ───────────────')
console.log(`  System prompt        : ~${estimateTokens(systemPrompt)} tokens`)
console.log(`  User prompt          : ~${estimateTokens(sampleUserPrompt)} tokens`)
console.log(`  Total input          : ~${inputTokens} tokens`)
console.log(`  Output (${STICKERS_PER_PACK} prompts)  : ~${outputTokens} tokens`)
console.log(`  Input cost           : $${llmInputCost.toFixed(6)}`)
console.log(`  Output cost          : $${llmOutputCost.toFixed(6)}`)
console.log(`  LLM subtotal         : $${llmTotalCost.toFixed(6)}`)
console.log()

console.log('── Image Generation ────────────────────────────────────────')
console.log(`  Style previews       : ${STYLE_PREVIEWS} images × $${FAL_PER_IMAGE.toFixed(2)} = $${previewImageCost.toFixed(2)}`)
console.log(`  Sticker pack         : ${STICKERS_PER_PACK} images × $${FAL_PER_IMAGE.toFixed(2)} = $${packImageCost.toFixed(2)}`)
console.log()

console.log('── Totals ──────────────────────────────────────────────────')
console.log(`  Pack only (no previews)  : $${packOnlyCost.toFixed(4)}`)
console.log(`  Fully loaded (w/ previews): $${fullyLoadedCost.toFixed(4)}`)
console.log()

console.log('── Unit Economics ──────────────────────────────────────────')
console.log(`  Cost per sticker         : $${(fullyLoadedCost / STICKERS_PER_PACK).toFixed(4)}`)
console.log(`  Packs per $1             : ${Math.floor(1 / fullyLoadedCost)}`)
console.log(`  Packs per $10            : ${Math.floor(10 / fullyLoadedCost)}`)
console.log(`  LLM % of total cost      : ${((llmTotalCost / fullyLoadedCost) * 100).toFixed(1)}%`)
console.log(`  Image gen % of total cost: ${(((packImageCost + previewImageCost) / fullyLoadedCost) * 100).toFixed(1)}%`)
console.log()
console.log('── Notes ───────────────────────────────────────────────────')
console.log('  - Excludes retries (1 retry per sticker on failure)')
console.log('  - Excludes Supabase storage/bandwidth')
console.log('  - Token counts are estimates (~4 chars/token)')
console.log('  - Using 0.5K resolution (0.75× rate); standard 1K = $0.08, 2K = $0.12, 4K = $0.16')
console.log('  - Fireworks cached input tokens are 50% cheaper ($0.10/1M)')
console.log('═══════════════════════════════════════════════════════════════')
