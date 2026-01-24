/**
 * POST /api/generate/packs
 * Generate sticker packs from selected styles
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { generateStickerPack, type PackGenerationResult } from '@/src/lib/services/pack.service'
import { getPublicUrl } from '@/src/lib/utils/storage'
import { SESSION_COOKIE_NAME } from '@/src/lib/constants/session'
import { storageConfig } from '@/src/lib/config'
import type { FidelityLevel, StylePreview, Generation } from '@/src/types/database'

interface GeneratePacksRequest {
  generationId: string
  selectedStyleIds: string[]
}

interface GeneratePacksResponse {
  packs: Array<{
    id: string
    styleName: string
    stickers: Array<{
      id: string
      sequenceNumber: number
      imageUrl: string
      emotion: string | null
      hasText: boolean
      textContent: string | null
    }>
    zipUrl: string | null
  }>
  remainingGenerations: number
  errors: string[]
}

interface ErrorResponse {
  error: string
  code?: string
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<GeneratePacksResponse | ErrorResponse>> {
  try {
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
    const cookieStore = await cookies()

    // Verify session
    const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session not found', code: 'NO_SESSION' },
        { status: 401 }
      )
    }

    // Get session and verify ownership
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Invalid session', code: 'INVALID_SESSION' },
        { status: 401 }
      )
    }

    // Check remaining generations
    const remaining = session.max_generations - session.generation_count
    if (remaining < selectedStyleIds.length) {
      return NextResponse.json(
        {
          error: `Not enough generations remaining. Need ${selectedStyleIds.length}, have ${remaining}`,
          code: 'INSUFFICIENT_GENERATIONS',
        },
        { status: 403 }
      )
    }

    // Get generation record and verify it belongs to session
    const { data: generation, error: genError } = await supabase
      .from('generations')
      .select('*, uploads(*)')
      .eq('id', generationId)
      .eq('session_id', sessionId)
      .single()

    if (genError || !generation) {
      return NextResponse.json(
        { error: 'Generation not found', code: 'NOT_FOUND' },
        { status: 404 }
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

    // Update generation status to processing
    await supabase
      .from('generations')
      .update({ status: 'processing' })
      .eq('id', generationId)

    // Generate packs for each selected style
    const results: PackGenerationResult[] = []
    const allErrors: string[] = []

    for (const stylePreview of stylePreviews as StylePreview[]) {
      try {
        const result = await generateStickerPack({
          generationId,
          stylePreviewId: stylePreview.id,
          styleName: stylePreview.style_name,
          style: stylePreview.fidelity_level,
          characterPrompt: (generation as Generation).style_description ?? '',
          language: (generation as Generation).language,
          personalContext: (generation as Generation).personal_context ?? undefined,
          count: 10,
        })

        results.push(result)
        allErrors.push(...result.errors)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Pack generation failed'
        console.error(`Failed to generate pack for style ${stylePreview.style_name}:`, message)
        allErrors.push(`${stylePreview.style_name}: ${message}`)
      }
    }

    if (results.length === 0) {
      return NextResponse.json(
        { error: 'All pack generations failed', code: 'ALL_FAILED' },
        { status: 500 }
      )
    }

    // Increment generation count (one per pack generated)
    await supabase
      .from('sessions')
      .update({
        generation_count: session.generation_count + results.length,
        last_active_at: new Date().toISOString(),
      })
      .eq('id', sessionId)

    // Build response
    const packs = results.map(result => ({
      id: result.pack.id,
      styleName: result.pack.style_name,
      stickers: result.stickers.map(sticker => ({
        id: sticker.id,
        sequenceNumber: sticker.sequence_number,
        imageUrl: getPublicUrl(supabase, storageConfig.stickerBucket, sticker.storage_path),
        emotion: sticker.emotion,
        hasText: sticker.has_text,
        textContent: sticker.text_content,
      })),
      zipUrl: result.zipUrl,
    }))

    const newRemaining = session.max_generations - session.generation_count - results.length

    return NextResponse.json({
      packs,
      remainingGenerations: newRemaining,
      errors: allErrors,
    })
  } catch (error) {
    console.error('Pack generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

