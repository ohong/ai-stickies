/**
 * GET /api/generations/{generationId}/results
 * Fetch generated sticker packs for a generation
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { storageConfig } from '@/src/lib/config'

const SESSION_COOKIE_NAME = 'ai-stickies-session'

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
  stickers: StickerResponse[]
  zipUrl: string | null
}

interface ResultsResponse {
  packs: PackResponse[]
  remainingGenerations: number
  errors: string[]
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
    const cookieStore = await cookies()

    // Verify session
    const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session not found', code: 'NO_SESSION' },
        { status: 401 }
      )
    }

    // Get session
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

    // Verify generation belongs to session
    const { data: generation, error: genError } = await supabase
      .from('generations')
      .select('*')
      .eq('id', generationId)
      .eq('session_id', sessionId)
      .single()

    if (genError || !generation) {
      return NextResponse.json(
        { error: 'Generation not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
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
    const packResponses: PackResponse[] = packs.map(pack => ({
      id: pack.id,
      styleName: pack.style_name,
      stickers: (stickersByPack.get(pack.id) || []).map(sticker => ({
        id: sticker.id,
        sequenceNumber: sticker.sequence_number,
        imageUrl: getPublicUrl(supabase, storageConfig.stickerBucket, sticker.storage_path),
        emotion: sticker.emotion,
        hasText: sticker.has_text,
        textContent: sticker.text_content,
      })),
      zipUrl: pack.zip_storage_path
        ? getPublicUrl(supabase, storageConfig.stickerBucket, pack.zip_storage_path)
        : null,
    }))

    const remainingGenerations = session.max_generations - session.generation_count

    return NextResponse.json({
      packs: packResponses,
      remainingGenerations,
      errors: [],
    })
  } catch (error) {
    console.error('Results fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function getPublicUrl(
  supabase: ReturnType<typeof createAdminClient>,
  bucket: string,
  path: string
): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}
