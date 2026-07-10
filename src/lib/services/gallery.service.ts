/**
 * Gallery service
 * Fetches public and featured packs for the gallery page
 */

import { createAdminClient } from '../supabase/admin'
import { getSignedUrl } from '../utils/storage'
import { storageConfig } from '../config'
import type { Sticker } from '../../types/database'

export interface PublicPack {
  id: string
  styleName: string
  shareSlug: string
  viewCount: number
  createdAt: string
  thumbnails: string[] // URLs for first 4 stickers
}

/**
 * Fetch public packs with pagination, ordered by newest first
 */
export async function getPublicPacks(options: {
  page: number
  limit: number
}): Promise<{ packs: PublicPack[]; total: number }> {
  const supabase = createAdminClient()
  const { page, limit } = options
  const offset = (page - 1) * limit

  // Get total count
  const { count } = await supabase
    .from('sticker_packs')
    .select('*', { count: 'exact', head: true })
    .eq('is_public', true)

  // Get packs with their stickers
  const { data: packs, error } = await supabase
    .from('sticker_packs')
    .select('id, style_name, share_slug, view_count, created_at, stickers(storage_path, sequence_number)')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error || !packs) {
    return { packs: [], total: 0 }
  }

  const publicPacks: PublicPack[] = await Promise.all(packs.map(async (pack) => {
    const stickers = ((pack.stickers ?? []) as Pick<Sticker, 'storage_path' | 'sequence_number'>[])
      .sort((a, b) => a.sequence_number - b.sequence_number)
      .slice(0, 4)

    const thumbnails = await Promise.all(stickers.map((s) =>
      getSignedUrl(supabase, storageConfig.stickerBucket, s.storage_path, 60 * 60)
    ))

    return {
      id: pack.id,
      styleName: pack.style_name,
      shareSlug: pack.share_slug!,
      viewCount: pack.view_count,
      createdAt: pack.created_at,
      thumbnails,
    }
  }))

  return { packs: publicPacks, total: count ?? 0 }
}

/**
 * Fetch featured packs
 */
export async function getFeaturedPacks(limit: number): Promise<PublicPack[]> {
  const supabase = createAdminClient()

  const { data: packs, error } = await supabase
    .from('sticker_packs')
    .select('id, style_name, share_slug, view_count, created_at, stickers(storage_path, sequence_number)')
    .eq('is_public', true)
    .eq('is_featured', true)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error || !packs) {
    return []
  }

  return Promise.all(packs.map(async (pack) => {
    const stickers = ((pack.stickers ?? []) as Pick<Sticker, 'storage_path' | 'sequence_number'>[])
      .sort((a, b) => a.sequence_number - b.sequence_number)
      .slice(0, 4)

    const thumbnails = await Promise.all(stickers.map((s) =>
      getSignedUrl(supabase, storageConfig.stickerBucket, s.storage_path, 60 * 60)
    ))

    return {
      id: pack.id,
      styleName: pack.style_name,
      shareSlug: pack.share_slug!,
      viewCount: pack.view_count,
      createdAt: pack.created_at,
      thumbnails,
    }
  }))
}
