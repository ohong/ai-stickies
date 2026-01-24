/**
 * Generate sample sticker images for the landing page using FLUX.2 API
 * Run with: bun scripts/generate-samples.ts
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
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'samples')

const BFL_API_KEY = process.env.BFL_API_KEY

if (!BFL_API_KEY) {
  console.error('Error: BFL_API_KEY environment variable is required')
  process.exit(1)
}

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

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function generateImage(prompt: string): Promise<string> {
  // Step 1: Submit generation request
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
    }),
  })

  if (!submitResponse.ok) {
    const errorText = await submitResponse.text()
    throw new Error(`Submit failed: ${errorText}`)
  }

  const { polling_url } = await submitResponse.json() as { id: string; polling_url: string }

  // Step 2: Poll for result
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
      if (attempts % 10 === 0) console.log(`  Still generating... (attempt ${attempts})`)
      continue
    }

    if (status === 'Error' || status === 'Failed') {
      throw new Error(`Generation failed: ${status}`)
    }

    if (status === 'Request Moderated' || status === 'Content Moderated') {
      throw new Error(`Content moderated: ${status}`)
    }

    // Unknown status - keep polling
    console.warn(`  Unknown status: ${status}, continuing...`)
  }

  throw new Error('Generation timed out')
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
