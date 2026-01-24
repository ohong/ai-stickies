import { NextRequest, NextResponse } from 'next/server'
import { getSessionIdFromCookie } from '@/src/lib/services/session.service'
import { getGenerationWithPreviews } from '@/src/lib/services/generation.service'

interface GenerationSuccessResponse {
  generation: {
    id: string
    status: string
    language: string
    createdAt: string
  }
  previews: Array<{
    id: string
    styleName: string
    fidelityLevel: string
    description: string
    previewUrl: string
  }>
}

interface GenerationErrorResponse {
  error: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ generationId: string }> }
): Promise<NextResponse<GenerationSuccessResponse | GenerationErrorResponse>> {
  try {
    const { generationId } = await params

    // Verify session
    const sessionId = await getSessionIdFromCookie()
    if (!sessionId) {
      return NextResponse.json(
        { error: 'No session found' },
        { status: 401 }
      )
    }

    // Get generation with previews
    const result = await getGenerationWithPreviews(generationId)

    if (!result) {
      return NextResponse.json(
        { error: 'Generation not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (result.generation.session_id !== sessionId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      generation: {
        id: result.generation.id,
        status: result.generation.status,
        language: result.generation.language,
        createdAt: result.generation.created_at,
      },
      previews: result.previews,
    })
  } catch (error) {
    console.error('Get generation error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch generation' },
      { status: 500 }
    )
  }
}
