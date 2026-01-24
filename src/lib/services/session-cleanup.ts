import { createAdminClient } from '@/src/lib/supabase/admin'
import { sessionConfig } from '@/src/lib/config'

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
    // First get count of sessions to delete
    const { count: countBefore } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .lt('last_active_at', cutoffDate.toISOString())

    // Delete expired sessions (cascades to related records)
    const { error } = await supabase
      .from('sessions')
      .delete()
      .lt('last_active_at', cutoffDate.toISOString())

    if (error) {
      return {
        deletedCount: 0,
        error: error.message,
      }
    }

    return {
      deletedCount: countBefore ?? 0,
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
        .lt('last_active_at', cutoffDate.toISOString()),
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
