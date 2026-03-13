/**
 * Pack Download API
 * GET /api/packs/{packId}/download
 *
 * Downloads a sticker pack as a ZIP file with LINE-compatible structure.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { getSessionIdFromCookie } from '@/src/lib/services/session.service'
import { storageConfig } from '@/src/lib/config'
import { createPackZip } from '@/src/lib/utils/zip'
import { createMainImageComposite, createTabImage } from '@/src/lib/services/image-processing.service'
import type { Sticker, StickerPack, Generation } from '@/src/types/database'

interface PackWithRelations extends StickerPack {
  stickers: Sticker[]
  generations: Generation
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ packId: string }> }
): Promise<NextResponse> {
  try {
    const { packId } = await params

    // Verify session
    const sessionId = await getSessionIdFromCookie()
    if (!sessionId) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 })
    }

    const supabase = createAdminClient()

    // Fetch pack with stickers and generation (for ownership check)
    const { data: pack, error: packError } = await supabase
      .from('sticker_packs')
      .select(`
        *,
        stickers (*),
        generations!inner (*)
      `)
      .eq('id', packId)
      .single()

    if (packError || !pack) {
      return NextResponse.json({ error: 'Pack not found' }, { status: 404 })
    }

    const packData = pack as unknown as PackWithRelations

    // Verify ownership through generation -> session
    if (packData.generations.session_id !== sessionId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const stickers = packData.stickers
    if (!stickers || stickers.length === 0) {
      return NextResponse.json({ error: 'No stickers in pack' }, { status: 400 })
    }

    // Fetch sticker buffers from storage, skipping any that are missing
    const stickerResults = await Promise.all(
      stickers
        .sort((a, b) => a.sequence_number - b.sequence_number)
        .map(async (sticker) => {
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
            emotion: sticker.emotion ?? undefined,
            hasText: sticker.has_text,
            textContent: sticker.text_content,
          }
        })
    )

    const stickerData = stickerResults.filter(
      (s): s is NonNullable<typeof s> => s !== null
    )

    if (stickerData.length === 0) {
      return NextResponse.json(
        { error: 'No sticker files available for download' },
        { status: 404 }
      )
    }

    // Create main and tab images
    const stickerBuffers = stickerData.map((s) => s.buffer)
    const [mainImage, tabImage] = await Promise.all([
      createMainImageComposite(stickerBuffers.slice(0, 4)),
      createTabImage(stickerBuffers[0]),
    ])

    // Create ZIP
    const zipBuffer = await createPackZip({
      stickers: stickerData,
      mainImage,
      tabImage,
      packName: packData.style_name,
    })

    // Return ZIP as download
    const sanitizedName = packData.style_name.replace(/[^a-zA-Z0-9-_]/g, '_')

    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="stickers-${sanitizedName}.zip"`,
        'Content-Length': zipBuffer.length.toString(),
        'Cache-Control': 'private, no-cache',
      },
    })
  } catch (error) {
    console.error('Pack download error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Download failed' },
      { status: 500 }
    )
  }
}
