import { existsSync } from 'fs'
import { generateImage as generateRunwayImage, resultToUrl } from '../src/lib/ai/provider'
/**
 * Generate sample sticker images for the landing page using the budget-capped Runway router
 * Run with: bun scripts/generate-samples.ts
 */

import { mkdir, writeFile } from 'fs/promises'
import path from 'path'

const OUTPUT_DIR = path.join(process.cwd(), 'public', 'samples')


const samplePrompts = [
  {
    name: 'chibi-happy',
    prompt: 'Cute chibi style sticker of a happy person waving, big head small body, kawaii anime style, simple clean lines, white background, LINE sticker style, expressive face, transparent PNG style',
  },
  {
    name: 'chibi-love',
    prompt: 'Cute chibi style sticker of a person making a heart gesture with hands, big sparkling eyes, kawaii anime style, pink cheeks, white background, LINE sticker style, transparent PNG style',
  },
  {
    name: 'chibi-thumbsup',
    prompt: 'Cute chibi style sticker of a confident person giving thumbs up, big head small body, kawaii anime style, cheerful expression, white background, LINE sticker style, transparent PNG style',
  },
  {
    name: 'chibi-sleepy',
    prompt: 'Cute chibi style sticker of a sleepy person with ZZZ floating, big head small body, kawaii anime style, droopy eyes, white background, LINE sticker style, transparent PNG style',
  },
  {
    name: 'chibi-surprised',
    prompt: 'Cute chibi style sticker of a surprised person with wide eyes, big head small body, kawaii anime style, shocked expression, white background, LINE sticker style, transparent PNG style',
  },
  {
    name: 'chibi-celebrate',
    prompt: 'Cute chibi style sticker of a person celebrating with confetti, big head small body, kawaii anime style, joyful expression, white background, LINE sticker style, transparent PNG style',
  },
]

async function generateImage(prompt: string): Promise<string> {
  return resultToUrl(await generateRunwayImage({ prompt }))
}

async function downloadImage(url: string, outputPath: string): Promise<void> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`)
  }
  const buffer = await response.arrayBuffer()
  await writeFile(outputPath, Buffer.from(buffer))
}

async function main() {
  console.log('Generating sample stickers for landing page...\n')

  // Create output directory
  if (!existsSync(OUTPUT_DIR)) {
    await mkdir(OUTPUT_DIR, { recursive: true })
    console.log(`Created directory: ${OUTPUT_DIR}\n`)
  }

  for (const sample of samplePrompts) {
    const outputPath = path.join(OUTPUT_DIR, `${sample.name}.png`)

    // Skip if already exists
    if (existsSync(outputPath)) {
      console.log(`Skipping ${sample.name} (already exists)`)
      continue
    }

    console.log(`Generating: ${sample.name}`)
    console.log(`  Prompt: ${sample.prompt.substring(0, 60)}...`)

    try {
      const imageUrl = await generateImage(sample.prompt)
      console.log(`  Generated, downloading...`)

      await downloadImage(imageUrl, outputPath)
      console.log(`  Saved to: ${outputPath}\n`)
    } catch (error) {
      console.error(`  Error: ${error instanceof Error ? error.message : error}\n`)
    }
  }

  console.log('Done!')
}

main().catch(console.error)
