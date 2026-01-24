import { NextResponse } from 'next/server'
import {
  getOrCreateSession,
  getSessionHistory,
  getStylePreviewCount,
} from '@/src/lib/services/session.service'

export async function GET() {
  try {
    const session = await getOrCreateSession()
    const history = await getSessionHistory(session.id)

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
