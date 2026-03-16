/**
 * Platform-specific Export API
 * GET /api/packs/{packId}/export/{platform}
 *
 * Downloads a ZIP of stickers processed for the specified platform.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { getSessionIdFromCookie } from '@/src/lib/services/session.service'
import { storageConfig } from '@/src/lib/config'
import { PLATFORMS, type Platform } from '@/src/constants/platform-specs'
import { exportForPlatform } from '@/src/lib/services/export'
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
    const zipBuffer = await exportForPlatform(platform, validStickers, packData.style_name)

    // Return as download
    const filename = `${packData.style_name.replace(/\s+/g, '-').toLowerCase()}-${platform}-stickers.zip`

    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(zipBuffer.length),
      },
    })
  } catch (error) {
    console.error('Platform export error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Export failed' },
      { status: 500 }
    )
  }
}
