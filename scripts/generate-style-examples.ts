import { existsSync } from 'fs'
import { generateImage as generateRunwayImage, resultToUrl } from '../src/lib/ai/provider'
/**
 * Generate style example stickers for the landing page style gallery
 * Run with: bun scripts/generate-style-examples.ts
 */

import { mkdir, writeFile } from 'fs/promises'
import path from 'path'

const OUTPUT_DIR = path.join(process.cwd(), 'public', 'landing', 'styles')

const stylePrompts = [
  {
    name: 'style-high-fidelity',
    style: 'High Fidelity',
    prompt: 'highly detailed cartoon portrait of a friendly young woman waving hello, realistic proportions, accurate facial features, professional quality illustration, clean lines, vibrant colors, soft shading, white background, LINE sticker style, no text',
  },
  {
    name: 'style-stylized',
    style: 'Stylized',
    prompt: 'stylized cute blob character with expressive happy face, artistic interpretation, dynamic pose with arms raised, bold black outlines, saturated pastel colors, playful artistic flair, white background, LINE sticker style, no text',
  },
  {
    name: 'style-abstract',
    style: 'Abstract',
    prompt: 'abstract geometric character made of simple shapes, modern art style flat design, bold colors pink blue yellow, simplified forms, creative artistic interpretation, white background, LINE sticker style, no text',
  },
  {
    name: 'style-chibi',
    style: 'Chibi',
    prompt: 'adorable chibi character with oversized head and tiny body, kawaii anime style, big sparkling eyes, cute happy expression, rounded features, soft pastel colors, white background, LINE sticker style, no text',
  },
  {
    name: 'style-minimalist',
    style: 'Minimalist',
    prompt: 'minimalist line art character, simple clean single stroke design, essential features only, black lines on white background, lots of white space, modern clean aesthetic, LINE sticker style, no text',
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
  console.log('Generating style example stickers with FLUX.2...\n')

  // Create output directory
  if (!existsSync(OUTPUT_DIR)) {
    await mkdir(OUTPUT_DIR, { recursive: true })
    console.log(`Created directory: ${OUTPUT_DIR}\n`)
  }

  let generated = 0
  let skipped = 0

  for (const sticker of stylePrompts) {
    const outputPath = path.join(OUTPUT_DIR, `${sticker.name}.png`)

    // Skip if already exists (use --force flag to regenerate)
    if (existsSync(outputPath) && !process.argv.includes('--force')) {
      console.log(`Skipping ${sticker.style} (exists). Use --force to regenerate.`)
      skipped++
      continue
    }

    console.log(`Generating: ${sticker.style}`)
    console.log(`  Prompt: ${sticker.prompt.slice(0, 80)}...`)

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
