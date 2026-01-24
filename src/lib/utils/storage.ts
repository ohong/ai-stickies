/**
 * Storage utilities for Supabase
 */

import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Get public URL for a storage path
 * Works with any Supabase client (admin or regular)
 */
export function getPublicUrl(
  supabase: Pick<SupabaseClient, 'storage'>,
  bucket: string,
  path: string
): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}
