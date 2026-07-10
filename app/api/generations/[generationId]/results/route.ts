/**
 * GET /api/generations/{generationId}/results
 * Fetch generated sticker packs for a generation
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { getSignedUrl } from '@/src/lib/utils/storage'
import { storageConfig } from '@/src/lib/config'
import { getSession } from '@/src/lib/services/session.service'
import {
  AuthorizationError,
  requireGenerationAccess,
} from '@/src/lib/services/authorization.service'
import { reconcileStalePackGeneration } from '@/src/lib/services/pack.service'
import type { Generation } from '@/src/types/database'

interface StickerResponse {
  id: string
  sequenceNumber: number
  imageUrl: string
  emotion: string | null
  hasText: boolean
  textContent: string | null
}

interface PackResponse {
  id: string
  styleName: string
  stickersCompleted: number
  stickers: StickerResponse[]
  zipUrl: string | null
}

interface ResultsResponse {
  status: string
  packs: PackResponse[]
  remainingGenerations: number
  errors: string[]
  totalStickersPerPack: number
}

interface ErrorResponse {
  error: string
  code?: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ generationId: string }> }
): Promise<NextResponse<ResultsResponse | ErrorResponse>> {
  try {
    const { generationId } = await params
    const supabase = createAdminClient()

    const access = await requireGenerationAccess<Generation>(generationId)
    const generation = access.generation
    const session = await getSession(generation.session_id)
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found', code: 'NO_SESSION' },
        { status: 401 }
      )
    }

    const wasStale = await reconcileStalePackGeneration(generation)
    if (wasStale) {
      generation.status = 'failed'
    }

    // Get all sticker packs for this generation
    const { data: packs, error: packsError } = await supabase
      .from('sticker_packs')
      .select('*')
      .eq('generation_id', generationId)
      .order('created_at', { ascending: true })

    if (packsError) {
      console.error('Error fetching packs:', packsError)
      return NextResponse.json(
        { error: 'Failed to fetch packs', code: 'FETCH_ERROR' },
        { status: 500 }
      )
    }

    if (!packs || packs.length === 0) {
      if (generation.status === 'processing' || generation.status === 'pending' || generation.status === 'failed') {
        return NextResponse.json({
          status: generation.status,
          packs: [],
          remainingGenerations: session.max_generations - session.generation_count,
          errors: generation.status === 'failed' ? ['Pack generation failed'] : [],
          totalStickersPerPack: 10,
        })
      }

      return NextResponse.json(
        { error: 'No packs found for this generation', code: 'NO_PACKS' },
        { status: 404 }
      )
    }

    // Get stickers for all packs
    const packIds = packs.map(p => p.id)
    const { data: stickers, error: stickersError } = await supabase
      .from('stickers')
      .select('*')
      .in('pack_id', packIds)
      .order('sequence_number', { ascending: true })

    if (stickersError) {
      console.error('Error fetching stickers:', stickersError)
      return NextResponse.json(
        { error: 'Failed to fetch stickers', code: 'FETCH_ERROR' },
        { status: 500 }
      )
    }

    // Group stickers by pack
    const stickersByPack = new Map<string, typeof stickers>()
    for (const sticker of stickers || []) {
      const existing = stickersByPack.get(sticker.pack_id) || []
      existing.push(sticker)
      stickersByPack.set(sticker.pack_id, existing)
    }

    // Build response
    const packResponses: PackResponse[] = await Promise.all(packs.map(async (pack) => {
      const packStickers = stickersByPack.get(pack.id) || []
      return {
        id: pack.id,
        styleName: pack.style_name,
        stickersCompleted: packStickers.length,
        stickers: await Promise.all(packStickers.map(async (sticker) => ({
          id: sticker.id,
          sequenceNumber: sticker.sequence_number,
          imageUrl: await getSignedUrl(
            supabase,
            storageConfig.stickerBucket,
            sticker.storage_path,
            60 * 60
          ),
          emotion: sticker.emotion,
          hasText: sticker.has_text,
          textContent: sticker.text_content,
        }))),
        zipUrl: pack.zip_storage_path
          ? await getSignedUrl(supabase, storageConfig.stickerBucket, pack.zip_storage_path, 60 * 60)
          : null,
      }
    }))

    const remainingGenerations = session.max_generations - session.generation_count

    return NextResponse.json({
      status: generation.status,
      packs: packResponses,
      remainingGenerations,
      errors: [],
      totalStickersPerPack: 10,
    })
  } catch (error) {
    console.error('Results fetch error:', error)
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
