import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ---------------------------------------------------------------------------
// Mocks — must be declared before any import that triggers the module
// ---------------------------------------------------------------------------

vi.mock('@/src/lib/services/upload.service', () => ({
  initiateUpload: vi.fn(),
  completeUpload: vi.fn(),
  uploadFile: vi.fn(),
  UploadServiceError: class UploadServiceError extends Error {
    status: number
    constructor(message: string, status: number) {
      super(message)
      this.name = 'UploadServiceError'
      this.status = status
    }
  },
}))

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------

import { POST } from '@/app/api/upload/route'
import {
  initiateUpload,
  completeUpload,
  uploadFile,
  UploadServiceError,
} from '@/src/lib/services/upload.service'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function jsonRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function formDataRequest(file: File): NextRequest {
  const formData = new FormData()
  formData.append('file', file)
  return new NextRequest('http://localhost:3000/api/upload', {
    method: 'POST',
    body: formData,
  })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/upload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // -----------------------------------------------------------------------
  // JSON body — invalid action
  // -----------------------------------------------------------------------

  it('returns 400 for invalid action', async () => {
    const request = jsonRequest({ action: 'invalid-action' })
    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error).toBe('Invalid upload action')
  })

  // -----------------------------------------------------------------------
  // Invalid JSON body
  // -----------------------------------------------------------------------

  it('returns 400 for invalid request body (non-JSON)', async () => {
    const request = new NextRequest('http://localhost:3000/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json{{{',
    })
    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error).toBe('Invalid request body')
  })

  // -----------------------------------------------------------------------
  // Initiate action — success
  // -----------------------------------------------------------------------

  it('handles initiate action successfully', async () => {
    const mockResult = {
      sessionId: 'session-123',
      remainingGenerations: 9,
      signedUrl: 'https://storage.example.com/signed-url',
      storagePath: 'session-123/1234567890.png',
      token: 'upload-token-abc',
    }
    vi.mocked(initiateUpload).mockResolvedValue(mockResult)

    const request = jsonRequest({
      action: 'initiate',
      fileName: 'photo.png',
      mimeType: 'image/png',
      fileSize: 1024,
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toEqual(mockResult)
    expect(initiateUpload).toHaveBeenCalledWith({
      fileName: 'photo.png',
      mimeType: 'image/png',
      fileSize: 1024,
    })
  })

  // -----------------------------------------------------------------------
  // Complete action — success
  // -----------------------------------------------------------------------

  it('handles complete action successfully', async () => {
    const mockResult = {
      uploadId: 'upload-456',
      previewUrl: 'https://storage.example.com/preview.png',
      sessionId: 'session-123',
      remainingGenerations: 8,
    }
    vi.mocked(completeUpload).mockResolvedValue(mockResult)

    const request = jsonRequest({
      action: 'complete',
      storagePath: 'session-123/1234567890.png',
      fileName: 'photo.png',
      mimeType: 'image/png',
      fileSize: 1024,
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toEqual(mockResult)
    expect(completeUpload).toHaveBeenCalledWith({
      storagePath: 'session-123/1234567890.png',
      fileName: 'photo.png',
      mimeType: 'image/png',
      fileSize: 1024,
    })
  })

  // -----------------------------------------------------------------------
  // UploadServiceError (status 400)
  // -----------------------------------------------------------------------

  it('returns 400 for UploadServiceError with status 400', async () => {
    vi.mocked(initiateUpload).mockRejectedValue(
      new UploadServiceError('Invalid file type. Please upload a JPG, PNG, or WebP image.', 400)
    )

    const request = jsonRequest({
      action: 'initiate',
      fileName: 'file.txt',
      mimeType: 'text/plain',
      fileSize: 512,
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error).toContain('Invalid file type')
  })

  // -----------------------------------------------------------------------
  // Unexpected errors — 500
  // -----------------------------------------------------------------------

  it('returns 500 for unexpected errors', async () => {
    vi.mocked(initiateUpload).mockRejectedValue(new Error('Something went wrong'))

    const request = jsonRequest({
      action: 'initiate',
      fileName: 'photo.png',
      mimeType: 'image/png',
      fileSize: 1024,
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(500)
    expect(json.error).toBe('Internal server error')
  })

  // -----------------------------------------------------------------------
  // Form-data upload (file upload fallback)
  //
  // NextRequest with real FormData hangs in jsdom/vitest, so we create
  // a NextRequest with a non-JSON content-type and mock its formData()
  // method to simulate the multipart parsing result.
  // -----------------------------------------------------------------------

  it('handles form-data upload with file', async () => {
    const mockResult = {
      uploadId: 'upload-789',
      previewUrl: 'https://storage.example.com/preview.png',
      sessionId: 'session-123',
      remainingGenerations: 7,
    }
    vi.mocked(uploadFile).mockResolvedValue(mockResult)

    const file = new File(['fake-png-content'], 'photo.png', { type: 'image/png' })
    const mockFormData = new FormData()
    mockFormData.append('file', file)

    // Create a request with non-JSON content-type so it goes to formData branch
    const request = new NextRequest('http://localhost:3000/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'multipart/form-data' },
      body: 'placeholder',
    })

    // Override formData() to return our mock FormData
    vi.spyOn(request, 'formData').mockResolvedValue(mockFormData)

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toEqual(mockResult)
    expect(uploadFile).toHaveBeenCalledWith(expect.any(File))
  })

  // -----------------------------------------------------------------------
  // Form-data upload — no file provided
  // -----------------------------------------------------------------------

  it('returns 400 when form-data has no file', async () => {
    const mockFormData = new FormData()
    mockFormData.append('notFile', 'some string value')

    const request = new NextRequest('http://localhost:3000/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'multipart/form-data' },
      body: 'placeholder',
    })

    vi.spyOn(request, 'formData').mockResolvedValue(mockFormData)

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error).toBe('No file provided')
  })

  // -----------------------------------------------------------------------
  // UploadServiceError with different status codes
  // -----------------------------------------------------------------------

  it('returns 403 for UploadServiceError with status 403', async () => {
    vi.mocked(initiateUpload).mockRejectedValue(
      new UploadServiceError('No generations remaining in this session', 403)
    )

    const request = jsonRequest({
      action: 'initiate',
      fileName: 'photo.png',
      mimeType: 'image/png',
      fileSize: 1024,
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(403)
    expect(json.error).toContain('No generations remaining')
  })

  it('returns 401 for UploadServiceError with status 401 on complete', async () => {
    vi.mocked(completeUpload).mockRejectedValue(
      new UploadServiceError('No session found', 401)
    )

    const request = jsonRequest({
      action: 'complete',
      storagePath: 'some/path.png',
      fileName: 'photo.png',
      mimeType: 'image/png',
      fileSize: 1024,
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(401)
    expect(json.error).toContain('No session')
  })
})
