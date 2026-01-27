/**
 * Prompt templates for AI generation
 * Based on LINE sticker best practices
 */

/**
 * System prompt for all sticker generation tasks
 */
export const STICKER_SYSTEM_PROMPT = `You are an expert LINE sticker prompt engineer. Your job is to create detailed,
effective image generation prompts that comply with LINE Creator Guidelines.

LINE Sticker Guidelines (mandatory):
- Transparent background required
- 370x320px format with 10px margin from edges
- Designs must be suited for daily messaging conversations
- Clear, easily understood expressions
- Character should be centered and fill the frame
- Upper body or face close-up preferred (avoid tiny full-body figures)
- Bold outlines for visibility at small chat sizes
- No logos, brand references, or promotional content
- No non-communicative content (objects/scenery alone)

Prompt Guidelines:
- Be specific and descriptive
- Focus on emotion, pose, and visual elements
- Include style-specific modifiers
- Always specify transparent background
- Make characters expressive and readable at small sizes`

/**
 * Template for generating a style preview prompt
 * Variables: {style_name}, {style_modifiers}, {character_description}, {personal_context}
 */
export const PREVIEW_PROMPT_TEMPLATE = `Create a single image generation prompt for a {style_name} style LINE sticker.

Style: {style_name}
Style modifiers: {style_modifiers}
Character description: {character_description}
{personal_context_line}

Generate a prompt for a friendly, neutral expression sticker that showcases this style.
The prompt should:
- Describe a character with a warm, approachable expression
- Include specific visual style elements
- Specify simple/transparent background
- Mention proper framing for sticker format

Only output the prompt itself as a single paragraph, no explanation.`

/**
 * Template for generating multiple sticker prompts for a pack
 * Variables: {count}, {style_name}, {style_modifiers}, {character_context},
 *            {emotions_list}, {language_name}
 */
export const STICKER_PROMPTS_TEMPLATE = `Generate LINE sticker prompts for a pack of {count} stickers.

Style: {style_name}
Style modifiers: {style_modifiers}
{character_context_line}

Emotions to cover (one per sticker):
{emotions_list}

Text language: {language_name}
Text guidelines:
- About 60% of stickers should be graphics-only (no text)
- About 40% can include short text (1-3 words max)
- Text must be in {language_name}
- Text should match the emotion naturally
- Common expressions work best (greetings, reactions, etc.)

For each sticker, create a detailed prompt that:
- Clearly conveys the specified emotion for messaging use
- Shows character in expressive pose (upper body or face close-up preferred)
- ALWAYS specifies transparent background (LINE requirement)
- Optimized for 370x320px with 10px margin from edges
- Includes bold outlines for small-size visibility
- Includes style-specific visual elements
- No logos, brands, or promotional elements

Output in this exact JSON format:
[
  {{
    "emotion": "emotion_id",
    "scene": "brief scene description",
    "promptText": "full image generation prompt with all details",
    "hasText": false,
    "textContent": null
  }},
  ...
]

Only output the JSON array, no explanation.`

/**
 * Template for single sticker prompt refinement
 */
export const REFINE_PROMPT_TEMPLATE = `Refine this sticker prompt to be more specific and effective.

Original prompt: {original_prompt}
Style: {style_name}
Emotion: {emotion}

Make it:
- More descriptive of the visual elements
- Better suited for the {style_name} style
- Clearer about the character's expression and pose
- Specific about the background (simple/transparent)

Output only the refined prompt, no explanation.`

/**
 * Base sticker requirements to append to prompts
 * Based on LINE Creator Guidelines: https://creator.line.me/en/guideline/sticker/
 */
export const STICKER_BASE_REQUIREMENTS = `
LINE Sticker Requirements:
- Composition optimized for 370x320px with 10px margin from edges
- Transparent background (mandatory for LINE stickers)
- Bold outlines for visibility at small chat sizes
- Expressive, clear emotion suited for daily messaging conversations
- Character centered and filling the frame (avoid full-body/elongated figures)
- Upper body or face close-up preferred for readability
- Clean, professional sticker art style
- No logos, brand references, or promotional content`

/**
 * Style-specific prompt additions
 */
export const STYLE_PROMPT_ADDITIONS: Record<string, string> = {
  high: 'Highly detailed with accurate facial features, realistic proportions, professional quality illustration with clean lines and vibrant colors.',
  stylized: 'Artistic interpretation with expressive features, dynamic poses, bold outlines, and saturated colors. Stylized but recognizable.',
  abstract: 'Simplified geometric forms, modern flat design aesthetic, bold color blocks, minimalist representation while maintaining expressiveness.',
  chibi: 'Cute chibi style with exaggerated big head and small body, kawaii aesthetics, rounded features, soft pastel colors, anime-inspired.',
  minimalist: 'Ultra-clean minimalist design, essential features only, generous white space, subtle monochrome accents, sophisticated simplicity.',
}

/**
 * Language-specific text examples for prompts
 */
export const TEXT_EXAMPLES: Record<string, string[]> = {
  en: ['Hi!', 'Thanks!', 'OK!', 'LOL', 'Wow!', 'Yay!', 'Sorry!', 'Hmm...'],
  ja: ['やったー！', 'ありがとう！', 'OK！', 'www', 'わーい！', 'ごめんね！', 'うーん...'],
  'zh-TW': ['耶！', '謝謝！', 'OK！', '笑死', '哇！', '對不起！', '嗯...'],
  'zh-CN': ['耶！', '谢谢！', 'OK！', '笑死', '哇！', '对不起！', '嗯...'],
  th: ['เย้!', 'ขอบคุณ!', 'โอเค!', '555', 'ว้าว!', 'ขอโทษ!', 'อืม...'],
  id: ['Hore!', 'Terima kasih!', 'OK!', 'Wkwk', 'Wah!', 'Maaf!', 'Hmm...'],
  ko: ['야호!', '고마워!', '오케이!', 'ㅋㅋㅋ', '와!', '미안해!', '음...'],
}
