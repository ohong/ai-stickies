/**
 * FLUX.2 image generation via BFL API
 * https://docs.bfl.ai/
 */

import { aiConfig, generationConfig } from '../config'

const BFL_API_BASE = 'https://api.bfl.ai/v1'

// --- Types ---

export interface FluxGenerationOptions {
  prompt: string
  inputImage?: string // URL or base64 encoded image for image-to-image
  width?: number
  height?: number
}

export interface FluxResult {
  imageUrl: string
  id: string
}

export class FluxError extends Error {
  constructor(
    message: string,
    public code?: string
  ) {
    super(message)
    this.name = 'FluxError'
  }
}

// --- Helper ---

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// --- Main API ---

/**
 * Generate an image with FLUX.2
 *
 * 1. Submit generation request to BFL API
 * 2. Poll the returned polling_url until ready
 * 3. Return the image URL
 */
export async function generateImage(options: FluxGenerationOptions): Promise<FluxResult> {
  const apiKey = aiConfig.bflApiKey
  if (!apiKey) {
    throw new FluxError('BFL_API_KEY not configured', 'NO_API_KEY')
  }

  // Step 1: Build request body
  const requestBody: Record<string, unknown> = {
    prompt: options.prompt,
    width: options.width ?? generationConfig.imageWidth,
    height: options.height ?? generationConfig.imageHeight,
    output_format: 'png', // Required for transparent stickers
  }

  // Add input image for image-to-image generation
  if (options.inputImage) {
    requestBody.input_image = options.inputImage
  }

  // Step 2: Submit generation request
  const submitResponse = await fetch(`${BFL_API_BASE}/${aiConfig.bflModel}`, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'Content-Type': 'application/json',
      'x-key': apiKey,
    },
    body: JSON.stringify(requestBody),
  })

  if (!submitResponse.ok) {
    const errorText = await submitResponse.text()
    throw new FluxError(`Failed to submit: ${errorText}`, 'SUBMIT_ERROR')
  }

  const submitData = await submitResponse.json() as {
    id: string
    polling_url: string
  }

  const { id, polling_url } = submitData

  // Step 3: Poll for result
  let attempts = 0
  const maxAttempts = generationConfig.maxPollAttempts

  while (attempts < maxAttempts) {
    await sleep(500) // Poll every 500ms as per docs
    attempts++

    const pollResponse = await fetch(polling_url, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'x-key': apiKey,
      },
    })

    if (!pollResponse.ok) {
      const errorText = await pollResponse.text()
      throw new FluxError(`Poll failed: ${errorText}`, 'POLL_ERROR')
    }

    const pollData = await pollResponse.json() as {
      status: string
      result?: { sample: string }
    }

    const status = pollData.status

    // Ready - return the image URL
    if (status === 'Ready') {
      const imageUrl = pollData.result?.sample
      if (!imageUrl) {
        throw new FluxError('No image URL in response', 'NO_IMAGE')
      }
      return { imageUrl, id }
    }

    // Still processing - continue polling
    if (status === 'Pending' || status === 'Processing') {
      continue
    }

    // Error states
    if (status === 'Error' || status === 'Failed') {
      throw new FluxError(`Generation failed: ${status}`, 'GENERATION_FAILED')
    }

    if (status === 'Request Moderated' || status === 'Content Moderated') {
      throw new FluxError(`Content moderated: ${status}`, 'MODERATED')
    }

    // Unknown status - keep polling (don't fail on unknown)
    console.warn(`Unknown FLUX status: ${status}, continuing to poll...`)
  }

  throw new FluxError(`Timed out after ${attempts} attempts`, 'TIMEOUT')
}

/**
 * Check if FLUX is available (API key configured)
 */
export function isFluxAvailable(): boolean {
  return Boolean(aiConfig.bflApiKey)
}
