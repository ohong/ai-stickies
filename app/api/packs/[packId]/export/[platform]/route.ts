/**
 * Platform-specific Export API
 * GET /api/packs/{packId}/export/{platform}
 *
 * Downloads a ZIP of stickers processed for the specified platform.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { storageConfig } from '@/src/lib/config'
import { PLATFORMS, type Platform } from '@/src/constants/platform-specs'
import { exportForPlatform } from '@/src/lib/services/export'
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
  { params }: { params: Promise<{ packId: string; platform: string }> }
): Promise<NextResponse> {
  try {
    const { packId, platform: platformParam } = await params

    // Validate platform
    if (!PLATFORMS.includes(platformParam as Platform)) {
      return NextResponse.json(
        { error: `Invalid platform. Must be one of: ${PLATFORMS.join(', ')}` },
        { status: 400 }
      )
    }

    const platform = platformParam as Platform

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
      return NextResponse.json({ error: 'No stickers found in pack' }, { status: 400 })
    }

    // Sort by sequence number
    const sortedStickers = stickers.sort(
      (a, b) => a.sequence_number - b.sequence_number
    )

    // Download sticker images from storage
    const stickerData = await Promise.all(
      sortedStickers.map(async (sticker) => {
        const { data, error } = await supabase.storage
          .from(storageConfig.stickerBucket)
          .download(sticker.storage_path)

        if (error || !data) {
          console.warn(`Skipping missing sticker: ${sticker.storage_path}`)
          return null
        }

        return {
          buffer: Buffer.from(await data.arrayBuffer()),
          sequenceNumber: sticker.sequence_number,
          emotion: sticker.emotion ?? undefined,
        }
      })
    )

    const validStickers = stickerData.filter(
      (s): s is NonNullable<typeof s> => s !== null
    )

    if (validStickers.length === 0) {
      return NextResponse.json({ error: 'No sticker files available' }, { status: 400 })
    }

    // Process and create ZIP
    const zipBuffer = await exportForPlatform(platform, validStickers, pack.style_name)

    // Return as download
    const filename = `${pack.style_name.replace(/\s+/g, '-').toLowerCase()}-${platform}-stickers.zip`

    return new NextResponse(new Uint8Array(zipBuffer), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(zipBuffer.length),
      },
    })
  } catch (error) {
    console.error('Platform export error:', error)
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Export failed' },
      { status: 500 }
    )
  }
}
