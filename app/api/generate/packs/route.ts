/**
 * POST /api/generate/packs
 * Generate sticker packs from selected styles
 */

import { NextRequest, NextResponse } from 'next/server'
import { after } from 'next/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { requireAuth, AuthError } from '@/src/lib/services/auth.service'
import {
  deletePacksWithArtifacts,
  generateStickerPack,
  reconcileStalePackGeneration,
  type PackGenerationResult,
} from '@/src/lib/services/pack.service'
import { generationConfig, storageConfig } from '@/src/lib/config'
import {
  refundPackGenerationCharge,
  startPackGenerationCharge,
} from '@/src/lib/services/credits.service'
import { getSessionIdFromCookie, setSessionCookie } from '@/src/lib/services/session.service'
import {
  AuthorizationError,
  requireGenerationAccess,
} from '@/src/lib/services/authorization.service'
import type { StylePreview, Generation, Upload } from '@/src/types/database'

export const runtime = 'nodejs'
export const maxDuration = 300

interface GeneratePacksRequest {
  generationId: string
  selectedStyleIds: string[]
}

interface StartPacksResponse {
  generationId: string
}

interface ErrorResponse {
  error: string
  code?: string
}

interface GenerationWithUpload extends Generation {
  uploads: Upload | Upload[] | null
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<StartPacksResponse | ErrorResponse>> {
  try {
    let authenticatedUserId: string
    try {
      const user = await requireAuth()
      authenticatedUserId = user.id
    } catch (err) {
      if (err instanceof AuthError) {
        return NextResponse.json(
          { error: 'Login required to generate sticker packs', code: 'AUTH_REQUIRED' },
          { status: 401 }
        )
      }
      throw err
    }

    const body = await request.json() as GeneratePacksRequest
    const { generationId, selectedStyleIds } = body

    // Validate request
    if (!generationId) {
      return NextResponse.json(
        { error: 'generationId is required' },
        { status: 400 }
      )
    }

    if (!selectedStyleIds || selectedStyleIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one style must be selected' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()
    const sessionId = await getSessionIdFromCookie()
    const { generation } = await requireGenerationAccess<GenerationWithUpload>(
      generationId,
      '*, uploads(*)'
    )
    await setSessionCookie(generation.session_id)

    const wasStale = await reconcileStalePackGeneration(generation)
    if (generation.status === 'processing' && !wasStale) {
      return NextResponse.json(
        { error: 'Pack generation is already running', code: 'ALREADY_RUNNING' },
        { status: 409 }
      )
    }

    const { data: existingPacks, error: existingPacksError } = await supabase
      .from('sticker_packs')
      .select('id')
      .eq('generation_id', generationId)
      .limit(1)

    if (existingPacksError) {
      return NextResponse.json(
        { error: 'Failed to check existing packs', code: 'FETCH_ERROR' },
        { status: 500 }
      )
    }

    if (existingPacks && existingPacks.length > 0) {
      if (generation.status === 'failed' || wasStale) {
        await deletePacksWithArtifacts(existingPacks.map((pack) => pack.id))
      } else {
        return NextResponse.json(
          { error: 'Pack generation has already started', code: 'ALREADY_RUNNING' },
          { status: 409 }
        )
      }
    }

    if (wasStale) {
      generation.status = 'failed'
    }

    if (generation.status === 'completed' && existingPacks && existingPacks.length > 0) {
      return NextResponse.json(
        { error: 'Pack generation has already started', code: 'ALREADY_RUNNING' },
        { status: 409 }
      )
    }

    // Get selected style previews
    const { data: stylePreviews, error: styleError } = await supabase
      .from('style_previews')
      .select('*')
      .eq('generation_id', generationId)
      .in('id', selectedStyleIds)

    if (styleError || !stylePreviews || stylePreviews.length === 0) {
      return NextResponse.json(
        { error: 'Style previews not found', code: 'STYLES_NOT_FOUND' },
        { status: 404 }
      )
    }

    if (stylePreviews.length !== selectedStyleIds.length) {
      return NextResponse.json(
        { error: 'One or more selected styles were not found', code: 'STYLES_NOT_FOUND' },
        { status: 404 }
      )
    }

    let lockedGeneration: Generation
    try {
      lockedGeneration = await startPackGenerationCharge({
        generationId,
        sessionId,
        userId: authenticatedUserId,
        packCount: selectedStyleIds.length,
      })
    } catch (error) {
      return mapStartPackError(error)
    }

    const generationRecord: GenerationWithUpload = {
      ...generation,
      ...lockedGeneration,
      uploads: generation.uploads,
    }
    const selectedStylePreviews = stylePreviews as StylePreview[]

    after(async () => {
      await runPackGenerationJob({
        generation: generationRecord,
        selectedStylePreviews,
        reservedCredits: selectedStyleIds.length,
      })
    })

    return NextResponse.json({ generationId }, { status: 202 })
  } catch (error) {
    console.error('Pack generation error:', error)
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function runPackGenerationJob(input: {
  generation: GenerationWithUpload
  selectedStylePreviews: StylePreview[]
  reservedCredits: number
}) {
  const supabase = createAdminClient()

  try {
    const reference = await getPackReferenceImage(input.generation)

    const settled = await Promise.allSettled(
      input.selectedStylePreviews.map((stylePreview) =>
        generateStickerPack({
          generationId: input.generation.id,
          stylePreviewId: stylePreview.id,
          styleName: stylePreview.style_name,
          style: stylePreview.fidelity_level,
          characterPrompt: input.generation.style_description ?? 'person in reference photo',
          language: input.generation.language,
          personalContext: input.generation.personal_context ?? undefined,
          count: generationConfig.defaultPackSize,
          referenceImageBase64: reference?.base64,
          referenceImageMimeType: reference?.mimeType,
        })
      )
    )

    const results: PackGenerationResult[] = []
    for (let i = 0; i < settled.length; i++) {
      const outcome = settled[i]
      if (outcome.status === 'fulfilled') {
        results.push(outcome.value)
      } else {
        const styleName = input.selectedStylePreviews[i].style_name
        const message = outcome.reason instanceof Error ? outcome.reason.message : 'Pack generation failed'
        console.error(`Failed to generate pack for style ${styleName}:`, message)
      }
    }

    if (results.length !== input.reservedCredits) {
      await deletePacksWithArtifacts(results.map((result) => result.pack.id))
      await refundPackGenerationCharge(input.generation.id, input.reservedCredits)
      await supabase
        .from('generations')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', input.generation.id)
      return
    }

    await supabase
      .from('generations')
      .update({
        status: results.length > 0 ? 'completed' : 'failed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', input.generation.id)
  } catch (error) {
    console.error('Background pack generation failed:', error)
    await refundPackGenerationCharge(input.generation.id, input.reservedCredits)
    await supabase
      .from('generations')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', input.generation.id)
  }
}

function mapStartPackError(error: unknown): NextResponse<ErrorResponse> {
  const message = error instanceof Error ? error.message : 'Failed to start generation'

  if (message.includes('RATE_LIMIT_EXCEEDED')) {
    return NextResponse.json(
      { error: 'Not enough generations remaining', code: 'INSUFFICIENT_GENERATIONS' },
      { status: 403 }
    )
  }

  if (message.includes('INSUFFICIENT_CREDITS')) {
    return NextResponse.json(
      { error: 'Not enough credits', code: 'INSUFFICIENT_CREDITS' },
      { status: 403 }
    )
  }

  if (message.includes('GENERATION_ALREADY_PROCESSING')) {
    return NextResponse.json(
      { error: 'Pack generation is already running', code: 'ALREADY_RUNNING' },
      { status: 409 }
    )
  }

  if (message.includes('ACCESS_DENIED')) {
    return NextResponse.json(
      { error: 'Access denied', code: 'ACCESS_DENIED' },
      { status: 403 }
    )
  }

  return NextResponse.json(
    { error: 'Failed to start generation', code: 'START_FAILED' },
    { status: 500 }
  )
}

async function getPackReferenceImage(
  generation: Generation & { uploads: Upload | Upload[] | null }
): Promise<{ base64: string; mimeType: string } | null> {
  if (!generationConfig.packUseReferenceImage) {
    return null
  }

  const upload = Array.isArray(generation.uploads)
    ? generation.uploads[0]
    : generation.uploads

  if (!upload?.storage_path) {
    return null
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase.storage
    .from(storageConfig.uploadBucket)
    .download(upload.storage_path)

  if (error || !data) {
    throw new Error(`Failed to download reference image: ${error?.message ?? 'Unknown error'}`)
  }

  const arrayBuffer = await data.arrayBuffer()
  return {
    base64: Buffer.from(arrayBuffer).toString('base64'),
    mimeType: data.type || upload.mime_type || 'image/png',
  }
}
