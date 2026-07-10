import { createAdminClient } from '@/src/lib/supabase/admin'
import { sessionConfig, storageConfig } from '@/src/lib/config'

interface CleanupResult {
  deletedCount: number
  error: string | null
}

/**
 * Clean up sessions older than configured TTL
 * Can be called via cron job or on-demand
 */
export async function cleanupExpiredSessions(): Promise<CleanupResult> {
  const supabase = createAdminClient()

  // Calculate cutoff date
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - sessionConfig.sessionTtlDays)

  try {
    const { data: candidates, error: candidateError } = await supabase
      .from('sessions')
      .select('id')
      .lt('last_active_at', cutoffDate.toISOString())
      .is('user_id', null)

    if (candidateError) {
      return {
        deletedCount: 0,
        error: candidateError.message,
      }
    }

    const candidateIds = (candidates ?? []).map((session) => session.id)
    if (candidateIds.length === 0) {
      return {
        deletedCount: 0,
        error: null,
      }
    }

    const safeSessionIds = await filterSessionsWithoutPublicPacks(candidateIds)
    if (safeSessionIds.length === 0) {
      return {
        deletedCount: 0,
        error: null,
      }
    }

    await removeStorageForSessions(safeSessionIds)

    const { error } = await supabase
      .from('sessions')
      .delete()
      .in('id', safeSessionIds)

    if (error) {
      return {
        deletedCount: 0,
        error: error.message,
      }
    }

    return {
      deletedCount: safeSessionIds.length,
      error: null,
    }
  } catch (err) {
    return {
      deletedCount: 0,
      error: err instanceof Error ? err.message : 'Unknown error during cleanup',
    }
  }
}

/**
 * Get stats about sessions for monitoring
 */
export async function getSessionStats(): Promise<{
  totalSessions: number
  activeSessions: number
  expiredSessions: number
  error: string | null
}> {
  const supabase = createAdminClient()

  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - sessionConfig.sessionTtlDays)

  try {
    const [totalResult, expiredResult] = await Promise.all([
      supabase.from('sessions').select('*', { count: 'exact', head: true }),
      supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .lt('last_active_at', cutoffDate.toISOString())
        .is('user_id', null),
    ])

    const total = totalResult.count ?? 0
    const expired = expiredResult.count ?? 0

    return {
      totalSessions: total,
      activeSessions: total - expired,
      expiredSessions: expired,
      error: null,
    }
  } catch (err) {
    return {
      totalSessions: 0,
      activeSessions: 0,
      expiredSessions: 0,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

async function filterSessionsWithoutPublicPacks(sessionIds: string[]): Promise<string[]> {
  const supabase = createAdminClient()
  const { data: publicGenerations, error } = await supabase
    .from('generations')
    .select('session_id, sticker_packs!inner(id)')
    .in('session_id', sessionIds)
    .eq('sticker_packs.is_public', true)

  if (error) {
    throw new Error(`Failed to inspect public packs: ${error.message}`)
  }

  const protectedSessionIds = new Set(
    (publicGenerations ?? []).map((generation) => generation.session_id)
  )

  return sessionIds.filter((sessionId) => !protectedSessionIds.has(sessionId))
}

async function removeStorageForSessions(sessionIds: string[]): Promise<void> {
  const supabase = createAdminClient()

  const { data: uploads, error: uploadsError } = await supabase
    .from('uploads')
    .select('storage_path')
    .in('session_id', sessionIds)

  if (uploadsError) {
    throw new Error(`Failed to fetch upload artifacts: ${uploadsError.message}`)
  }

  const { data: generations, error: generationsError } = await supabase
    .from('generations')
    .select('id')
    .in('session_id', sessionIds)

  if (generationsError) {
    throw new Error(`Failed to fetch generation artifacts: ${generationsError.message}`)
  }

  const generationIds = (generations ?? []).map((generation) => generation.id)
  const uploadPaths = (uploads ?? []).map((upload) => upload.storage_path)
  const stickerPaths = new Set<string>()

  if (generationIds.length > 0) {
    const { data: previews, error: previewsError } = await supabase
      .from('style_previews')
      .select('preview_storage_path')
      .in('generation_id', generationIds)

    if (previewsError) {
      throw new Error(`Failed to fetch preview artifacts: ${previewsError.message}`)
    }

    for (const preview of previews ?? []) {
      stickerPaths.add(preview.preview_storage_path)
    }

    const { data: packs, error: packsError } = await supabase
      .from('sticker_packs')
      .select('id, zip_storage_path, marketplace_zip_path')
      .in('generation_id', generationIds)

    if (packsError) {
      throw new Error(`Failed to fetch pack artifacts: ${packsError.message}`)
    }

    const packIds = (packs ?? []).map((pack) => pack.id)
    for (const pack of packs ?? []) {
      if (pack.zip_storage_path) stickerPaths.add(pack.zip_storage_path)
      if (pack.marketplace_zip_path) stickerPaths.add(pack.marketplace_zip_path)
    }

    if (packIds.length > 0) {
      const { data: stickers, error: stickersError } = await supabase
        .from('stickers')
        .select('storage_path')
        .in('pack_id', packIds)

      if (stickersError) {
        throw new Error(`Failed to fetch sticker artifacts: ${stickersError.message}`)
      }

      for (const sticker of stickers ?? []) {
        stickerPaths.add(sticker.storage_path)
      }
    }
  }

  await removeStoragePaths(storageConfig.uploadBucket, uploadPaths)
  await removeStoragePaths(storageConfig.stickerBucket, [...stickerPaths])
}

async function removeStoragePaths(bucket: string, paths: string[]): Promise<void> {
  if (paths.length === 0) return

  const supabase = createAdminClient()
  for (let i = 0; i < paths.length; i += 100) {
    const chunk = paths.slice(i, i + 100)
    const { error } = await supabase.storage.from(bucket).remove(chunk)
    if (error) {
      throw new Error(`Failed to remove storage paths from ${bucket}: ${error.message}`)
    }
  }
}
