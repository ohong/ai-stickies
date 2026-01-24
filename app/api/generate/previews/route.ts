import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import {
  getSessionIdFromCookie,
  checkRateLimit,
  incrementGenerationCount,
} from '@/src/lib/services/session.service'
import { generateStylePreviews } from '@/src/lib/services/generation.service'
import type { Language, Provider } from '@/src/types/database'

interface GeneratePreviewsRequest {
  uploadId: string
  styleDescription?: string
  personalContext?: string
  language: Language
  provider?: Provider
}

interface PreviewData {
  id: string
  styleName: string
  fidelityLevel: string
  description: string
  previewUrl: string
}

interface GeneratePreviewsSuccessResponse {
  generationId: string
  previews: PreviewData[]
  remainingGenerations: number
}

interface GeneratePreviewsErrorResponse {
  error: string
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<GeneratePreviewsSuccessResponse | GeneratePreviewsErrorResponse>> {
  try {
    // Get session from cookie
    const sessionId = await getSessionIdFromCookie()
    if (!sessionId) {
      return NextResponse.json(
        { error: 'No session found. Please upload an image first.' },
        { status: 401 }
      )
    }

    // Check rate limit
    const rateLimit = await checkRateLimit(sessionId)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'No generations remaining. Please try again later.' },
        { status: 403 }
      )
    }

    // Parse request body
    const body: GeneratePreviewsRequest = await request.json()

    if (!body.uploadId) {
      return NextResponse.json(
        { error: 'Upload ID is required' },
        { status: 400 }
      )
    }

    if (!body.language) {
      return NextResponse.json(
        { error: 'Language is required' },
        { status: 400 }
      )
    }

    // Get upload record to verify ownership and get storage path
    const supabase = createAdminClient()
    const { data: upload, error: uploadError } = await supabase
      .from('uploads')
      .select('*')
      .eq('id', body.uploadId)
      .eq('session_id', sessionId)
      .single()

    if (uploadError || !upload) {
      return NextResponse.json(
        { error: 'Upload not found or access denied' },
        { status: 404 }
      )
    }

    // Generate style previews
    const result = await generateStylePreviews({
      sessionId,
      uploadId: body.uploadId,
      storagePath: upload.storage_path,
      styleDescription: body.styleDescription,
      personalContext: body.personalContext,
      language: body.language,
      provider: body.provider,
    })

    // Increment generation count
    await incrementGenerationCount(sessionId)

    // Get updated remaining count
    const updatedRateLimit = await checkRateLimit(sessionId)

    return NextResponse.json({
      generationId: result.generationId,
      previews: result.previews,
      remainingGenerations: updatedRateLimit.remaining,
    })
  } catch (error) {
    console.error('Preview generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 }
    )
  }
}
