/**
 * Share service
 * Handles publishing/unpublishing packs and fetching public packs by slug
 */

import { createAdminClient } from '../supabase/admin'
import { getPublicUrl } from '../utils/storage'
import { storageConfig } from '../config'
import type { StickerPack, Sticker } from '../../types/database'

export interface PackWithStickers extends StickerPack {
  stickers: Array<Sticker & { imageUrl: string }>
}

const SLUG_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789'
const SLUG_LENGTH = 8

/**
 * Generate a short, URL-safe slug
 */
export function generateShareSlug(): string {
  let slug = ''
  for (let i = 0; i < SLUG_LENGTH; i++) {
    slug += SLUG_CHARS[Math.floor(Math.random() * SLUG_CHARS.length)]
  }
  return slug
}

/**
 * Publish a pack: set is_public=true and generate a share slug.
 * Verifies ownership via generation -> session -> user.
 */
export async function publishPack(
  packId: string,
  userId: string
): Promise<{ slug: string }> {
  const supabase = createAdminClient()

  // Fetch pack with generation for ownership check
  const { data: pack, error: fetchError } = await supabase
    .from('sticker_packs')
    .select('*, generations!inner(session_id)')
    .eq('id', packId)
    .single()

  if (fetchError || !pack) {
    throw new Error('Pack not found')
  }

  // Verify ownership: generation.session_id must match userId (session-based auth)
  const generation = (pack as Record<string, unknown>).generations as { session_id: string }
  if (generation.session_id !== userId) {
    throw new Error('Access denied')
  }

  // If already public with a slug, return existing slug
  if (pack.is_public && pack.share_slug) {
    return { slug: pack.share_slug }
  }

  // Generate a unique slug with retry
  let slug = generateShareSlug()
  let attempts = 0
  const maxAttempts = 5

  while (attempts < maxAttempts) {
    const { data: existing } = await supabase
      .from('sticker_packs')
      .select('id')
      .eq('share_slug', slug)
      .single()

    if (!existing) break
    slug = generateShareSlug()
    attempts++
  }

  if (attempts >= maxAttempts) {
    throw new Error('Failed to generate unique slug')
  }

  const { error: updateError } = await supabase
    .from('sticker_packs')
    .update({ is_public: true, share_slug: slug })
    .eq('id', packId)

  if (updateError) {
    throw new Error(`Failed to publish pack: ${updateError.message}`)
  }

  return { slug }
}

/**
 * Unpublish a pack: set is_public=false
 */
export async function unpublishPack(
  packId: string,
  userId: string
): Promise<void> {
  const supabase = createAdminClient()

  // Fetch pack with generation for ownership check
  const { data: pack, error: fetchError } = await supabase
    .from('sticker_packs')
    .select('*, generations!inner(session_id)')
    .eq('id', packId)
    .single()

  if (fetchError || !pack) {
    throw new Error('Pack not found')
  }

  const generation = (pack as Record<string, unknown>).generations as { session_id: string }
  if (generation.session_id !== userId) {
    throw new Error('Access denied')
  }

  const { error: updateError } = await supabase
    .from('sticker_packs')
    .update({ is_public: false })
    .eq('id', packId)

  if (updateError) {
    throw new Error(`Failed to unpublish pack: ${updateError.message}`)
  }
}

/**
 * Fetch a public pack by its share slug, including stickers with image URLs
 */
export async function getPackBySlug(
  slug: string
): Promise<PackWithStickers | null> {
  const supabase = createAdminClient()

  const { data: pack, error } = await supabase
    .from('sticker_packs')
    .select('*, stickers(*)')
    .eq('share_slug', slug)
    .eq('is_public', true)
    .single()

  if (error || !pack) {
    return null
  }

  const stickers = (pack.stickers as Sticker[])
    .sort((a, b) => a.sequence_number - b.sequence_number)
    .map((sticker) => ({
      ...sticker,
      imageUrl: getPublicUrl(supabase, storageConfig.stickerBucket, sticker.storage_path),
    }))

  return { ...pack, stickers } as PackWithStickers
}

/**
 * Increment view count for a pack (fire-and-forget)
 */
export async function incrementViewCount(packId: string): Promise<void> {
  const supabase = createAdminClient()

  // Simple read-then-write increment
  const { data } = await supabase
    .from('sticker_packs')
    .select('view_count')
    .eq('id', packId)
    .single()

  if (data) {
    await supabase
      .from('sticker_packs')
      .update({ view_count: (data.view_count ?? 0) + 1 })
      .eq('id', packId)
  }
}
