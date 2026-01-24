/**
 * Marketplace Export API
 * GET /api/session/marketplace-export?generationId={id}
 *
 * Exports all packs for a generation in LINE Creators Market format.
 * Creates a ZIP with proper structure for marketplace submission.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { getSessionIdFromCookie } from '@/src/lib/services/session.service'
import { storageConfig } from '@/src/lib/config'
import { createMarketplaceZip } from '@/src/lib/utils/zip'
import { createMainImageComposite, createTabImage, resizeForMarketplace } from '@/src/lib/services/image-processing.service'
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

    // Build pack data for marketplace ZIP
    const packDataForZip = await Promise.all(
      packs.map(async (pack) => {
        const stickers = pack.stickers
          .sort((a, b) => a.sequence_number - b.sequence_number)

        // Fetch and resize sticker buffers
        const stickerBuffers = await Promise.all(
          stickers.map(async (sticker) => {
            const { data, error } = await supabase.storage
              .from(storageConfig.stickerBucket)
              .download(sticker.storage_path)

            if (error || !data) {
              throw new Error(`Failed to download: ${sticker.storage_path}`)
            }

            const originalBuffer = Buffer.from(await data.arrayBuffer())
            // Resize to LINE marketplace specs (370x320)
            const resizedBuffer = await resizeForMarketplace(originalBuffer)

            return {
              sequenceNumber: sticker.sequence_number,
              buffer: resizedBuffer,
            }
          })
        )

        const buffers = stickerBuffers.map((s) => s.buffer)

        // Create pack images (main: 240x240, tab: 96x74)
        const [mainImage, tabImage] = await Promise.all([
          createMainImageComposite(buffers.slice(0, 4), { width: 240, height: 240 }),
          createTabImage(buffers[0], { width: 96, height: 74 }),
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

    // Create marketplace ZIP
    const zipBuffer = await createMarketplaceZip(packDataForZip)

    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="line-marketplace-${generationId.slice(0, 8)}.zip"`,
        'Content-Length': zipBuffer.length.toString(),
        'Cache-Control': 'private, no-cache',
      },
    })
  } catch (error) {
    console.error('Marketplace export error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Export failed' },
      { status: 500 }
    )
  }
}
