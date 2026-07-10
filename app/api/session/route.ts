import { NextResponse } from 'next/server'
import {
  getOrCreateSession,
  getSessionHistoryForActor,
  getStylePreviewCount,
} from '@/src/lib/services/session.service'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { storageConfig } from '@/src/lib/config'
import { getSignedUrl } from '@/src/lib/utils/storage'
import { getUser } from '@/src/lib/services/auth.service'

export async function GET() {
  try {
    const session = await getOrCreateSession()
    const user = await getUser()
    const history = await getSessionHistoryForActor(session.id, user?.id)
    const supabase = createAdminClient()

    const { data: latestUpload } = await supabase
      .from('uploads')
      .select('*')
      .eq('session_id', session.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // Build history with style counts
    const historyWithCounts = await Promise.all(
      history.map(async (gen) => {
        const styleCount =
          gen.status === 'completed' ? await getStylePreviewCount(gen.id) : undefined

        return {
          generationId: gen.id,
          createdAt: gen.created_at,
          status: gen.status,
          ...(styleCount !== undefined && { styleCount }),
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: {
        sessionId: session.id,
        generationCount: session.generation_count,
        remainingGenerations: session.max_generations - session.generation_count,
        maxGenerations: session.max_generations,
        history: historyWithCounts,
        latestUpload: latestUpload
          ? {
              uploadId: latestUpload.id,
              previewUrl: await getSignedUrl(
                supabase,
                storageConfig.uploadBucket,
                latestUpload.storage_path,
                60 * 60
              ),
              filename: latestUpload.original_filename ?? 'Uploaded photo',
              sizeBytes: latestUpload.size_bytes,
            }
          : null,
      },
    })
  } catch (error) {
    console.error('Session API error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get session',
      },
      { status: 500 }
    )
  }
}
