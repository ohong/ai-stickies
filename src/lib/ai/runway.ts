import sharp from 'sharp'
import { aiConfig } from '../config'

const API_BASE = 'https://api.dev.runwayml.com/v1'
export const MAX_IMAGE_CREDITS = 2
export const RUNWAY_MODEL = 'gen4_image_turbo'
const TASK_TIMEOUT_MS = 110_000

interface Routing {
  model: string
  estimatedCost: { credits: number }
  resolvedSettings: { priceCeiling: number | null }
}

async function request<T>(path: string, body?: unknown): Promise<T> {
  if (!aiConfig.runwayApiKey) throw new Error('RUNWAY_API_KEY not configured')
  // Only reads may retry. A submission can have succeeded even if its response is lost.
  const attempts = body === undefined ? 3 : 1
  let response: Response | undefined
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      response = await fetch(`${API_BASE}${path}`, {
        method: body === undefined ? 'GET' : 'POST',
        headers: {
          Authorization: `Bearer ${aiConfig.runwayApiKey}`,
          'X-Runway-Version': '2024-11-06',
          'Content-Type': 'application/json',
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(15_000),
      })
      if (response.ok) break
      if (response.status !== 429 && response.status < 500) break
    } catch (error) {
      if (attempt === attempts - 1) throw error
    }
    if (attempt < attempts - 1)
      await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)))
  }
  if (!response?.ok) {
    throw new Error(
      `Runway request failed (${response?.status ?? 'network unavailable'})`,
    )
  }
  return response.json() as Promise<T>
}

export async function verifyImageRouter(): Promise<void> {
  if (!aiConfig.runwayRouterId || !aiConfig.runwayRouterSlug) {
    throw new Error('Runway image router is not configured')
  }
  const router = await request<{
    slug: string
    settings: {
      maxCreditsPerGeneration?: { image?: number }
      models?: { mode: string; ids: string[] }
    }
  }>(`/routers/${encodeURIComponent(aiConfig.runwayRouterId)}`)
  const cap = router.settings.maxCreditsPerGeneration?.image
  const models = router.settings.models
  if (
    router.slug !== aiConfig.runwayRouterSlug ||
    typeof cap !== 'number' ||
    cap <= 0 ||
    cap > MAX_IMAGE_CREDITS ||
    models?.mode !== 'allowlist_only' ||
    models.ids.length !== 1 ||
    models.ids[0] !== RUNWAY_MODEL
  ) {
    throw new Error(
      'Runway router must allow only Gen-4 Image Turbo with a maximum of 2 credits per image',
    )
  }
}

export interface RunwayImageInput {
  prompt: string
  referenceImage?: string
  referenceImageMimeType?: string
}

async function buildInput(options: RunwayImageInput) {
  let referenceImages: Array<{ uri: string }> | undefined
  if (options.referenceImage) {
    // Runway limits data URIs to 5MB. Normalize any supported upload before sending.
    const image = await sharp(Buffer.from(options.referenceImage, 'base64'))
      .rotate()
      .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
      .flatten({ background: '#ffffff' })
      .jpeg({ quality: 85 })
      .toBuffer()
    referenceImages = [
      { uri: `data:image/jpeg;base64,${image.toString('base64')}` },
    ]
  }
  const requirements =
    'Keep the reference character recognizable. Single isolated sticker, bold closed dark outline, centered with clear margins, pure white background, no checkerboard or exterior shadows. No logos or watermarks. Include lettering only when explicitly requested.'
  // Gen-4 Image accepts at most 1,000 UTF-16 code units, including our constraints.
  const description = options.prompt
    .replace(/LINE sticker/gi, 'messaging sticker')
    .replace(/transparent(?: PNG)? background/gi, 'plain white background')
    .replace(/\s+/g, ' ')
    .trim()
  if (!description) throw new Error('Image prompt must not be empty')
  const promptText = `${description.slice(0, 999 - requirements.length)}\n${requirements}`
  return {
    promptText,
    referenceImages,
    aspectRatio: '1:1',
    resolution: '1k',
    outputCount: 1,
  }
}

export async function dryRunImage(options: RunwayImageInput): Promise<Routing> {
  await verifyImageRouter()
  const result = await request<{ routing: Routing }>('/generate/image', {
    configId: aiConfig.runwayRouterSlug,
    dryRun: true,
    input: await buildInput(options),
  })
  assertRouting(result.routing)
  return result.routing
}

function assertRouting(routing: Routing): void {
  if (
    routing.model !== RUNWAY_MODEL ||
    !Number.isFinite(routing.estimatedCost.credits) ||
    routing.estimatedCost.credits > MAX_IMAGE_CREDITS ||
    routing.resolvedSettings.priceCeiling === null ||
    routing.resolvedSettings.priceCeiling > MAX_IMAGE_CREDITS
  ) {
    throw new Error('Runway image routing exceeded the configured budget')
  }
}

class RunwayTaskError extends Error {
  constructor(public failureCode: string) {
    super(`Runway image generation failed (${failureCode})`)
  }
}

export async function generateRunwayImage(options: RunwayImageInput) {
  // Only a terminal INTERNAL failure permits one more submission: at most 4 credits
  // in total. Network errors, timeouts, moderation, and downstream errors never do.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = await submitImage(options)
      return { ...result, costCredits: result.costCredits * (attempt + 1) }
    } catch (error) {
      if (
        attempt === 0 &&
        error instanceof RunwayTaskError &&
        error.failureCode.startsWith('INTERNAL.')
      )
        continue
      throw error
    }
  }
  throw new Error('Runway image generation failed')
}

async function submitImage(options: RunwayImageInput) {
  await verifyImageRouter()
  // Submit exactly once. A timeout is ambiguous: retrying could buy a second image.
  const task = await request<{ id: string; routing: Routing }>(
    '/generate/image',
    {
      configId: aiConfig.runwayRouterSlug,
      input: await buildInput(options),
    },
  )
  assertRouting(task.routing)
  console.info('[runway] Image submitted', {
    taskId: task.id,
    model: task.routing.model,
    credits: task.routing.estimatedCost.credits,
  })
  const deadline = Date.now() + TASK_TIMEOUT_MS
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 2000))
    const result = await request<{
      status: string
      output?: string[]
      failureCode?: string
    }>(`/tasks/${encodeURIComponent(task.id)}`)
    if (result.status === 'SUCCEEDED' && result.output?.[0]) {
      return {
        imageUrl: result.output[0],
        provider: 'runway',
        model: task.routing.model,
        costCredits: task.routing.estimatedCost.credits,
      }
    }
    if (result.status === 'FAILED')
      throw new RunwayTaskError(result.failureCode ?? 'UNKNOWN')
    if (['CANCELED', 'CANCELLED'].includes(result.status))
      throw new Error('Runway image generation canceled')
  }
  throw new Error(
    'Runway image generation timed out. No automatic paid retry was submitted.',
  )
}
