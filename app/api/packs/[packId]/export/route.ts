/**
 * Marketplace Export API
 * POST /api/packs/{packId}/export
 *
 * Creates a marketplace-ready ZIP and validates against LINE specs.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { getSessionIdFromCookie } from '@/src/lib/services/session.service'
import { storageConfig } from '@/src/lib/config'
import { LINE_SPECS } from '@/src/constants/line-specs'
import { createMarketplaceZip } from '@/src/lib/utils/zip'
import {
  createMainImageComposite,
  createTabImage,
  getImageMetadata,
} from '@/src/lib/services/image-processing.service'
import type { Sticker, StickerPack, Generation } from '@/src/types/database'

interface PackWithRelations extends StickerPack {
  stickers: Sticker[]
  generations: Generation
}

interface ValidationStatus {
  status: 'valid' | 'invalid' | 'warning'
  message?: string
}

interface ExportRequirements {
  mainImage: { width: number; height: number } & ValidationStatus
  tabImage: { width: number; height: number } & ValidationStatus
  stickerCount: { count: number; min: number; max: number } & ValidationStatus
  stickerDimensions: ValidationStatus
  fileSize: { size: string; maxSize: string } & ValidationStatus
}

interface ExportResponse {
  marketplaceZipUrl: string
  requirements: ExportRequirements
  submissionGuide: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ packId: string }> }
): Promise<NextResponse<ExportResponse | { error: string }>> {
  try {
    const { packId } = await params

    // Verify session
    const sessionId = await getSessionIdFromCookie()
    if (!sessionId) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 })
    }

    const supabase = createAdminClient()

    // Fetch pack with stickers
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

    // Verify ownership
    if (packData.generations.session_id !== sessionId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const stickers = packData.stickers
    if (!stickers || stickers.length < LINE_SPECS.pack.minStickers) {
      return NextResponse.json(
        { error: `Minimum ${LINE_SPECS.pack.minStickers} stickers required` },
        { status: 400 }
      )
    }

    // Fetch and validate stickers
    const sortedStickers = stickers.sort(
      (a, b) => a.sequence_number - b.sequence_number
    )

    const stickerData = await Promise.all(
      sortedStickers.map(async (sticker) => {
        const { data, error } = await supabase.storage
          .from(storageConfig.stickerBucket)
          .download(sticker.storage_path)

        if (error || !data) {
          throw new Error(`Failed to download: ${sticker.storage_path}`)
        }

        const buffer = Buffer.from(await data.arrayBuffer())
        const metadata = await getImageMetadata(buffer)

        return {
          sequenceNumber: sticker.sequence_number,
          buffer,
          metadata,
          emotion: sticker.emotion ?? undefined,
          hasText: sticker.has_text,
          textContent: sticker.text_content,
        }
      })
    )

    // Create pack images
    const stickerBuffers = stickerData.map((s) => s.buffer)
    const [mainImage, tabImage] = await Promise.all([
      createMainImageComposite(stickerBuffers.slice(0, 4)),
      createTabImage(stickerBuffers[0]),
    ])

    // Validate against LINE specs
    const mainMeta = await getImageMetadata(mainImage)
    const tabMeta = await getImageMetadata(tabImage)

    const requirements: ExportRequirements = {
      mainImage: {
        width: mainMeta.width,
        height: mainMeta.height,
        status:
          mainMeta.width === LINE_SPECS.main.width &&
          mainMeta.height === LINE_SPECS.main.height
            ? 'valid'
            : 'invalid',
      },
      tabImage: {
        width: tabMeta.width,
        height: tabMeta.height,
        status:
          tabMeta.width === LINE_SPECS.tab.width &&
          tabMeta.height === LINE_SPECS.tab.height
            ? 'valid'
            : 'invalid',
      },
      stickerCount: {
        count: stickerData.length,
        min: LINE_SPECS.pack.minStickers,
        max: LINE_SPECS.pack.maxStickers,
        status:
          stickerData.length >= LINE_SPECS.pack.minStickers &&
          stickerData.length <= LINE_SPECS.pack.maxStickers
            ? 'valid'
            : 'invalid',
      },
      stickerDimensions: validateStickerDimensions(stickerData),
      fileSize: { size: '0', maxSize: '20MB', status: 'valid' },
    }

    // Create marketplace ZIP
    const zipBuffer = await createMarketplaceZip({
      stickers: stickerData,
      mainImage,
      tabImage,
      packName: packData.style_name,
    })

    // Update file size in requirements
    const sizeMB = (zipBuffer.length / (1024 * 1024)).toFixed(2)
    requirements.fileSize = {
      size: `${sizeMB}MB`,
      maxSize: '20MB',
      status: zipBuffer.length < 20 * 1024 * 1024 ? 'valid' : 'invalid',
    }

    // Upload to storage
    const marketplacePath = `${packData.generation_id}/${packId}/marketplace.zip`
    const { error: uploadError } = await supabase.storage
      .from(storageConfig.stickerBucket)
      .upload(marketplacePath, zipBuffer, {
        contentType: 'application/zip',
        upsert: true,
      })

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`)
    }

    // Update pack record
    await supabase
      .from('sticker_packs')
      .update({ marketplace_zip_path: marketplacePath })
      .eq('id', packId)

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(storageConfig.stickerBucket)
      .getPublicUrl(marketplacePath)

    return NextResponse.json({
      marketplaceZipUrl: urlData.publicUrl,
      requirements,
      submissionGuide: 'https://creator.line.me/en/howto/',
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Export failed' },
      { status: 500 }
    )
  }
}

function validateStickerDimensions(
  stickers: Array<{ metadata: { width: number; height: number } }>
): ValidationStatus {
  const { maxWidth, maxHeight } = LINE_SPECS.sticker

  const invalid = stickers.filter(
    (s) => s.metadata.width > maxWidth || s.metadata.height > maxHeight
  )

  if (invalid.length === 0) {
    return { status: 'valid' }
  }

  return {
    status: 'invalid',
    message: `${invalid.length} stickers exceed ${maxWidth}x${maxHeight}`,
  }
}
