/**
 * Pack Download API
 * GET /api/packs/{packId}/download
 *
 * Downloads a sticker pack as a ZIP file with LINE-compatible structure.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { storageConfig } from '@/src/lib/config'
import { createPackZip } from '@/src/lib/utils/zip'
import { createMainImageComposite, createTabImage } from '@/src/lib/services/image-processing.service'
import {
  AuthorizationError,
  requirePackAccess,
} from '@/src/lib/services/authorization.service'
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

    const supabase = createAdminClient()

    const { pack } = await requirePackAccess<PackWithRelations>(
      packId,
      `
        *,
        stickers (*),
        generations!inner (*)
      `
    )

    const stickers = pack.stickers
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
      packName: pack.style_name,
    })

    // Return ZIP as download
    const sanitizedName = pack.style_name.replace(/[^a-zA-Z0-9-_]/g, '_')

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
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Download failed' },
      { status: 500 }
    )
  }
}
