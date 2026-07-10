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

/**
 * Create a temporary signed URL for a private storage path.
 */
export async function getSignedUrl(
  supabase: Pick<SupabaseClient, 'storage'>,
  bucket: string,
  path: string,
  expiresInSeconds: number
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresInSeconds)

  if (error || !data) {
    throw new Error(`Failed to create signed URL: ${error?.message ?? 'Unknown error'}`)
  }

  return data.signedUrl
}
