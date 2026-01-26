/**
 * Generate style example stickers for the landing page style gallery
 * Run with: bun scripts/generate-style-examples.ts
 */

import { mkdir, writeFile, readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

// Load .env.local
const envPath = path.join(process.cwd(), '.env.local')
if (existsSync(envPath)) {
  const envContent = await readFile(envPath, 'utf-8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=')
      const value = valueParts.join('=')
      if (key && value) {
        process.env[key] = value
      }
    }
  }
}

const BFL_API_BASE = 'https://api.bfl.ai/v1'
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'landing', 'styles')
const BFL_API_KEY = process.env.BFL_API_KEY

if (!BFL_API_KEY) {
  console.error('Error: BFL_API_KEY not configured')
  process.exit(1)
}

// Style-specific prompts - each showcases the distinct visual characteristics
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

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function generateImage(prompt: string): Promise<string> {
  // Submit generation request
  const submitResponse = await fetch(`${BFL_API_BASE}/flux-2-pro`, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'Content-Type': 'application/json',
      'x-key': BFL_API_KEY!,
    },
    body: JSON.stringify({
      prompt,
      width: 512,
      height: 512,
      output_format: 'png',
    }),
  })

  if (!submitResponse.ok) {
    const errorText = await submitResponse.text()
    throw new Error(`Submit failed: ${errorText}`)
  }

  const { polling_url } = await submitResponse.json() as { id: string; polling_url: string }

  // Poll for result
  let attempts = 0
  while (attempts < 120) {
    await sleep(500)
    attempts++

    const pollResponse = await fetch(polling_url, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'x-key': BFL_API_KEY!,
      },
    })

    if (!pollResponse.ok) {
      const errorText = await pollResponse.text()
      throw new Error(`Poll failed: ${errorText}`)
    }

    const { status, result } = await pollResponse.json() as {
      status: string
      result?: { sample: string }
    }

    if (status === 'Ready') {
      if (!result?.sample) throw new Error('No image URL in response')
      return result.sample
    }

    if (status === 'Pending' || status === 'Processing') {
      if (attempts % 10 === 0) console.log(`  Still generating... (${attempts / 2}s)`)
      continue
    }

    if (status === 'Error' || status === 'Failed') {
      throw new Error(`Generation failed: ${status}`)
    }
  }

  throw new Error('Generation timed out')
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
