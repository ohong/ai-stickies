import { NextRequest, NextResponse } from 'next/server'
import {
  completeUpload,
  initiateUpload,
  uploadFile,
  UploadServiceError,
} from '@/src/lib/services/upload.service'

export const runtime = 'nodejs'

interface UploadInitSuccessResponse {
  sessionId: string
  remainingGenerations: number
  signedUrl: string
  storagePath: string
  token: string
}

interface UploadCompleteSuccessResponse {
  uploadId: string
  previewUrl: string
  sessionId: string
  remainingGenerations: number
}

interface UploadErrorResponse {
  error: string
}

interface UploadInitRequest {
  action: 'initiate'
  fileName: string
  mimeType: string
  fileSize: number
}

interface UploadCompleteRequest {
  action: 'complete'
  storagePath: string
  fileName: string
  mimeType: string
  fileSize: number
}

export async function POST(
  request: NextRequest
): Promise<
  NextResponse<UploadInitSuccessResponse | UploadCompleteSuccessResponse | UploadErrorResponse>
> {
  try {
    const contentType = request.headers.get('content-type') ?? ''

    if (contentType.includes('application/json')) {
      const body = await request.json() as UploadInitRequest | UploadCompleteRequest

      if (body.action === 'initiate') {
        const result = await initiateUpload({
          fileName: body.fileName,
          mimeType: body.mimeType,
          fileSize: body.fileSize,
        })

        return NextResponse.json(result)
      }

      if (body.action === 'complete') {
        const result = await completeUpload({
          storagePath: body.storagePath,
          fileName: body.fileName,
          mimeType: body.mimeType,
          fileSize: body.fileSize,
        })

        return NextResponse.json(result)
      }

      return NextResponse.json({ error: 'Invalid upload action' }, { status: 400 })
    }

    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const result = await uploadFile(file)
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    if (error instanceof UploadServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
