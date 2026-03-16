import { NextRequest, NextResponse } from 'next/server'
import { getSessionIdFromCookie } from '@/src/lib/services/session.service'
import { getGenerationWithPreviews } from '@/src/lib/services/generation.service'
import { getUser } from '@/src/lib/services/auth.service'

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

    // Verify access: check auth first, fall back to cookie session
    const user = await getUser()
    const sessionId = await getSessionIdFromCookie()

    if (!user && !sessionId) {
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

    // Verify ownership: auth user or cookie session
    const ownsViaAuth = user && result.generation.user_id === user.id
    const ownsViaCookie = sessionId && result.generation.session_id === sessionId
    if (!ownsViaAuth && !ownsViaCookie) {
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
