/**
 * Download All Packs API
 * GET /api/session/download-all?generationId={id}
 *
 * Downloads all packs for a generation as a combined ZIP.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { getSessionIdFromCookie } from '@/src/lib/services/session.service'
import { storageConfig } from '@/src/lib/config'
import { createMultiPackZip } from '@/src/lib/utils/zip'
import { createMainImageComposite, createTabImage } from '@/src/lib/services/image-processing.service'
import type { Sticker, StickerPack, Generation } from '@/src/types/database'

interface PackWithStickers extends StickerPack {
  stickers: Sticker[]
}

interface GenerationWithPacks extends Generation {
  sticker_packs: PackWithStickers[]
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const generationId = searchParams.get('generationId')

    if (!generationId) {
      return NextResponse.json({ error: 'generationId required' }, { status: 400 })
    }

    // Verify session
    const sessionId = await getSessionIdFromCookie()
    if (!sessionId) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 })
    }

    const supabase = createAdminClient()

    // Fetch generation with all packs and stickers
    const { data: generation, error: genError } = await supabase
      .from('generations')
      .select(`
        *,
        sticker_packs (
          *,
          stickers (*)
        )
      `)
      .eq('id', generationId)
      .single()

    if (genError || !generation) {
      return NextResponse.json({ error: 'Generation not found' }, { status: 404 })
    }

    const genData = generation as unknown as GenerationWithPacks

    // Verify ownership
    if (genData.session_id !== sessionId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const packs = genData.sticker_packs
    if (!packs || packs.length === 0) {
      return NextResponse.json({ error: 'No packs in generation' }, { status: 400 })
    }

    // Build pack data for ZIP
    const packDataForZip = await Promise.all(
      packs.map(async (pack) => {
        const stickers = pack.stickers
          .sort((a, b) => a.sequence_number - b.sequence_number)

        // Fetch sticker buffers, skipping missing files
        const stickerResults = await Promise.all(
          stickers.map(async (sticker) => {
            const { data, error } = await supabase.storage
              .from(storageConfig.stickerBucket)
              .download(sticker.storage_path)

            if (error || !data) {
              console.warn(`Skipping missing sticker: ${sticker.storage_path}`)
              return null
            }

            return {
              sequenceNumber: sticker.sequence_number,
              buffer: Buffer.from(await data.arrayBuffer()),
            }
          })
        )

        const stickerBuffers = stickerResults.filter(
          (s): s is NonNullable<typeof s> => s !== null
        )

        if (stickerBuffers.length === 0) return null

        const buffers = stickerBuffers.map((s) => s.buffer)

        // Create pack images
        const [mainImage, tabImage] = await Promise.all([
          createMainImageComposite(buffers.slice(0, 4)),
          createTabImage(buffers[0]),
        ])

        return {
          styleName: pack.style_name,
          stickers: stickerBuffers.map((s) => ({
            buffer: s.buffer,
            filename: `${String(s.sequenceNumber).padStart(2, '0')}.png`,
          })),
          mainImage,
          tabImage,
        }
      })
    )

    // Filter out packs where all stickers were missing
    const validPacks = packDataForZip.filter(
      (p): p is NonNullable<typeof p> => p !== null
    )

    if (validPacks.length === 0) {
      return NextResponse.json(
        { error: 'No sticker files available for download' },
        { status: 404 }
      )
    }

    // Create combined ZIP
    const zipBuffer = await createMultiPackZip(validPacks)

    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="stickers-all-${generationId.slice(0, 8)}.zip"`,
        'Content-Length': zipBuffer.length.toString(),
        'Cache-Control': 'private, no-cache',
      },
    })
  } catch (error) {
    console.error('Download all error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Download failed' },
      { status: 500 }
    )
  }
}
