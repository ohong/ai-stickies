import { existsSync } from 'fs'
import { generateImage as generateRunwayImage, resultToUrl } from '../src/lib/ai/provider'
/**
 * Generate sample stickers for the landing page hero section
 * Run with: bun scripts/generate-landing-stickers.ts
 */

import { mkdir, writeFile } from 'fs/promises'
import path from 'path'

const OUTPUT_DIR = path.join(process.cwd(), 'public', 'landing')

const stickerPrompts = [
  {
    name: 'sticker-wave',
    prompt: 'cute kawaii chibi character waving hello, big head tiny body, simple clean lines, pastel colors, white background, LINE sticker style, transparent PNG, joyful expression, no text',
  },
  {
    name: 'sticker-heart',
    prompt: 'adorable chibi girl making heart shape with hands above head, big sparkling eyes, pink blush cheeks, kawaii anime style, white background, LINE sticker, soft pastel colors, no text',
  },
  {
    name: 'sticker-thumbsup',
    prompt: 'cute cartoon boy giving enthusiastic thumbs up, chibi proportions, confident smile, simple cel shading, white background, LINE sticker style, clean outlines, no text',
  },
  {
    name: 'sticker-sleepy',
    prompt: 'sleepy kawaii character with droopy eyes and pillow, chibi style, soft expression, ZZZ floating, white background, LINE sticker, pastel blue tones, cozy feeling, no text',
  },
  {
    name: 'sticker-celebrate',
    prompt: 'excited chibi character jumping with joy, confetti around, big happy smile, kawaii style, white background, LINE sticker, vibrant but soft colors, celebration mood, no text',
  },
  {
    name: 'sticker-love',
    prompt: 'blushing kawaii character surrounded by floating hearts, chibi style, shy happy expression, pink tones, white background, LINE sticker, romantic cute feeling, no text',
  },
  {
    name: 'sticker-thinking',
    prompt: 'cute chibi character with hand on chin thinking pose, question marks floating, curious expression, white background, LINE sticker style, simple clean design, no text',
  },
  {
    name: 'sticker-cat',
    prompt: 'adorable kawaii cat character sitting, big round eyes, tiny smile, soft fluffy fur, chibi proportions, white background, LINE sticker style, cute and simple, no text',
  },
  {
    name: 'sticker-coffee',
    prompt: 'cute chibi character happily holding a warm cup of coffee, steam rising, cozy expression, kawaii style, white background, LINE sticker, warm brown tones, no text',
  },
  {
    name: 'sticker-star',
    prompt: 'chibi character with sparkle eyes reaching for stars, dreamy expression, magical sparkles around, kawaii anime style, white background, LINE sticker, soft purple and gold tones, no text',
  },
  {
    name: 'sticker-peace',
    prompt: 'cheerful kawaii character making peace sign, winking eye, cute smile, chibi proportions, white background, LINE sticker style, bright and friendly, no text',
  },
  {
    name: 'sticker-shy',
    prompt: 'shy kawaii character peeking from behind hands, blushing cheeks, big cute eyes, chibi style, white background, LINE sticker, soft pink tones, adorable expression, no text',
  },
]

async function generateImage(prompt: string): Promise<string> {
  return resultToUrl(await generateRunwayImage({ prompt }))
}

async function downloadImage(url: string, outputPath: string): Promise<void> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.statusText}`)
  }
  const buffer = await response.arrayBuffer()
  await writeFile(outputPath, Buffer.from(buffer))
}

async function main() {
  console.log('Generating landing page stickers with FLUX.2...\n')

  // Create output directory
  if (!existsSync(OUTPUT_DIR)) {
    await mkdir(OUTPUT_DIR, { recursive: true })
    console.log(`Created directory: ${OUTPUT_DIR}\n`)
  }

  let generated = 0
  let skipped = 0

  for (const sticker of stickerPrompts) {
    const outputPath = path.join(OUTPUT_DIR, `${sticker.name}.png`)

    // Skip if already exists
    if (existsSync(outputPath)) {
      console.log(`Skipping ${sticker.name} (exists)`)
      skipped++
      continue
    }

    console.log(`Generating: ${sticker.name}`)

    try {
      const imageUrl = await generateImage(sticker.prompt)
      await downloadImage(imageUrl, outputPath)
      console.log(`  Saved: ${outputPath}\n`)
      generated++
    } catch (error) {
      console.error(`  Error: ${error instanceof Error ? error.message : error}\n`)
    }
  }

  console.log(`\nDone! Generated: ${generated}, Skipped: ${skipped}`)
}

main().catch(console.error)
