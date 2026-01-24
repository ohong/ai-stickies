import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { SESSION_COOKIE_NAME } from '@/src/lib/constants/session'
import { storageConfig, sessionConfig } from '@/src/lib/config'

interface UploadSuccessResponse {
  uploadId: string
  previewUrl: string
  sessionId: string
  remainingGenerations: number
}

interface UploadErrorResponse {
  error: string
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<UploadSuccessResponse | UploadErrorResponse>> {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (!storageConfig.allowedMimeTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a JPG, PNG, or WebP image.' },
        { status: 400 }
      )
    }

    // Validate file size
    const maxSizeBytes = storageConfig.maxUploadSizeMb * 1024 * 1024
    if (file.size > maxSizeBytes) {
      return NextResponse.json(
        { error: `File size must be less than ${storageConfig.maxUploadSizeMb}MB` },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()
    const cookieStore = await cookies()

    // Get or create session
    let sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value
    let session = null

    if (sessionId) {
      const { data } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .single()
      session = data
    }

    if (!session) {
      // Create new session
      sessionId = crypto.randomUUID()
      const { data: newSession, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          id: sessionId,
          generation_count: 0,
          max_generations: sessionConfig.maxGenerations,
        })
        .select()
        .single()

      if (sessionError) {
        console.error('Session creation error:', sessionError)
        return NextResponse.json(
          { error: 'Failed to create session' },
          { status: 500 }
        )
      }

      session = newSession
    }

    // Check remaining generations
    const remaining = session.max_generations - session.generation_count
    if (remaining <= 0) {
      return NextResponse.json(
        { error: 'No generations remaining in this session' },
        { status: 403 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const extension = file.name.split('.').pop() || 'jpg'
    const storagePath = `${sessionId}/${timestamp}.${extension}`

    // Convert File to ArrayBuffer then to Uint8Array for upload
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(storageConfig.uploadBucket)
      .upload(storagePath, uint8Array, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      )
    }

    // Create upload record
    const { data: upload, error: dbError } = await supabase
      .from('uploads')
      .insert({
        session_id: sessionId,
        storage_path: storagePath,
        original_filename: file.name,
        mime_type: file.type,
        size_bytes: file.size,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database insert error:', dbError)
      // Clean up uploaded file
      await supabase.storage.from(storageConfig.uploadBucket).remove([storagePath])
      return NextResponse.json(
        { error: 'Failed to save upload record' },
        { status: 500 }
      )
    }

    // Update session last_active_at
    await supabase
      .from('sessions')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', sessionId)

    // Get public URL for preview
    const { data: urlData } = supabase.storage
      .from(storageConfig.uploadBucket)
      .getPublicUrl(storagePath)

    // Create response with session cookie
    const response = NextResponse.json({
      uploadId: upload.id,
      previewUrl: urlData.publicUrl,
      sessionId: sessionId!,
      remainingGenerations: remaining,
    })

    // Set session cookie
    const expires = new Date()
    expires.setDate(expires.getDate() + sessionConfig.sessionTtlDays)
    response.cookies.set(SESSION_COOKIE_NAME, sessionId!, {
      expires,
      path: '/',
      sameSite: 'lax',
      httpOnly: true,
    })

    return response
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
