import { describe, it, expect, vi, beforeEach } from 'vitest'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/src/lib/supabase/admin'

// Mock config modules
vi.mock('@/src/lib/config', () => ({
  storageConfig: {
    uploadBucket: 'uploads',
    stickerBucket: 'stickers',
    maxUploadSizeMb: 10,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
  sessionConfig: {
    maxGenerations: 10,
    sessionTtlDays: 1,
  },
}))

vi.mock('@/src/lib/constants/session', () => ({
  SESSION_COOKIE_NAME: 'ai-stickies-session',
  SESSION_MAX_AGE: 86400,
}))

// ---- Mock Supabase client factory ----

interface ChainableMock {
  from: ReturnType<typeof vi.fn>
  select: ReturnType<typeof vi.fn>
  insert: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
  eq: ReturnType<typeof vi.fn>
  single: ReturnType<typeof vi.fn>
  maybeSingle: ReturnType<typeof vi.fn>
  storage: {
    from: ReturnType<typeof vi.fn>
  }
}

function createMockSupabaseClient() {
  const chainable: ChainableMock = {
    from: vi.fn(),
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    eq: vi.fn(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
    storage: {
      from: vi.fn(),
    },
  }

  // Each chainable method returns the chainable object by default
  chainable.from.mockReturnValue(chainable)
  chainable.select.mockReturnValue(chainable)
  chainable.insert.mockReturnValue(chainable)
  chainable.update.mockReturnValue(chainable)
  chainable.eq.mockReturnValue(chainable)
  chainable.single.mockResolvedValue({ data: null, error: null })
  chainable.maybeSingle.mockResolvedValue({ data: null, error: null })

  // Storage mock
  const storageBucket = {
    createSignedUploadUrl: vi.fn(),
    upload: vi.fn(),
    list: vi.fn(),
    remove: vi.fn(),
    getPublicUrl: vi.fn().mockReturnValue({
      data: { publicUrl: 'https://example.com/public/test.png' },
    }),
  }
  chainable.storage.from.mockReturnValue(storageBucket)

  return { chainable, storageBucket }
}

// ---- Helpers ----

const TEST_SESSION_ID = 'test-session-id-1234'

function makeSession(overrides: Partial<import('@/src/types/database').Session> = {}): import('@/src/types/database').Session {
  return {
    id: TEST_SESSION_ID,
    created_at: '2026-01-01T00:00:00Z',
    last_active_at: '2026-01-01T00:00:00Z',
    generation_count: 0,
    max_generations: 10,
    ...overrides,
  }
}

function makeUpload(overrides: Partial<import('@/src/types/database').Upload> = {}): import('@/src/types/database').Upload {
  return {
    id: 'upload-id-1',
    session_id: TEST_SESSION_ID,
    storage_path: `${TEST_SESSION_ID}/123456.png`,
    original_filename: 'photo.png',
    mime_type: 'image/png',
    size_bytes: 1024,
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

const validMetadata = {
  fileName: 'photo.png',
  mimeType: 'image/png',
  fileSize: 1024,
}

// ---- Tests ----

describe('UploadServiceError', () => {
  it('has correct name, message, and status properties', async () => {
    const { UploadServiceError } = await import('@/src/lib/services/upload.service')

    const error = new UploadServiceError('test error', 400)

    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe('UploadServiceError')
    expect(error.message).toBe('test error')
    expect(error.status).toBe(400)
  })
})

describe('Validation', () => {
  let initiateUpload: typeof import('@/src/lib/services/upload.service').initiateUpload
  let UploadServiceError: typeof import('@/src/lib/services/upload.service').UploadServiceError

  beforeEach(async () => {
    vi.restoreAllMocks()
    const mod = await import('@/src/lib/services/upload.service')
    initiateUpload = mod.initiateUpload
    UploadServiceError = mod.UploadServiceError
  })

  it('rejects invalid MIME type', async () => {
    await expect(
      initiateUpload({ fileName: 'file.txt', mimeType: 'text/plain', fileSize: 1024 })
    ).rejects.toThrow(UploadServiceError)

    await expect(
      initiateUpload({ fileName: 'file.txt', mimeType: 'text/plain', fileSize: 1024 })
    ).rejects.toMatchObject({ status: 400, message: expect.stringContaining('Invalid file type') })
  })

  it('rejects file exceeding max size', async () => {
    const elevenMb = 11 * 1024 * 1024

    await expect(
      initiateUpload({ fileName: 'big.png', mimeType: 'image/png', fileSize: elevenMb })
    ).rejects.toThrow(UploadServiceError)

    await expect(
      initiateUpload({ fileName: 'big.png', mimeType: 'image/png', fileSize: elevenMb })
    ).rejects.toMatchObject({ status: 400, message: expect.stringContaining('10MB') })
  })

  it('accepts valid JPEG within size limit', async () => {
    const { chainable, storageBucket } = createMockSupabaseClient()
    vi.mocked(createAdminClient).mockReturnValue(chainable as any)

    const session = makeSession()
    // getOrCreateSessionContext: no cookie -> insert new session
    const mockCookieStore = { get: vi.fn().mockReturnValue(undefined), set: vi.fn() }
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as any)

    // insert -> select -> single for session creation
    chainable.single.mockResolvedValueOnce({ data: session, error: null })

    // createSignedUploadUrl
    storageBucket.createSignedUploadUrl.mockResolvedValue({
      data: { signedUrl: 'https://example.com/signed', path: 'path/file.jpg', token: 'tok' },
      error: null,
    })

    const result = await initiateUpload({
      fileName: 'photo.jpg',
      mimeType: 'image/jpeg',
      fileSize: 5 * 1024 * 1024,
    })

    expect(result.signedUrl).toBe('https://example.com/signed')
  })

  it('accepts valid PNG within size limit', async () => {
    const { chainable, storageBucket } = createMockSupabaseClient()
    vi.mocked(createAdminClient).mockReturnValue(chainable as any)

    const session = makeSession()
    const mockCookieStore = { get: vi.fn().mockReturnValue(undefined), set: vi.fn() }
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as any)

    chainable.single.mockResolvedValueOnce({ data: session, error: null })

    storageBucket.createSignedUploadUrl.mockResolvedValue({
      data: { signedUrl: 'https://example.com/signed', path: 'path/file.png', token: 'tok' },
      error: null,
    })

    const result = await initiateUpload({
      fileName: 'photo.png',
      mimeType: 'image/png',
      fileSize: 1024,
    })

    expect(result.signedUrl).toBe('https://example.com/signed')
  })

  it('accepts valid WebP within size limit', async () => {
    const { chainable, storageBucket } = createMockSupabaseClient()
    vi.mocked(createAdminClient).mockReturnValue(chainable as any)

    const session = makeSession()
    const mockCookieStore = { get: vi.fn().mockReturnValue(undefined), set: vi.fn() }
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as any)

    chainable.single.mockResolvedValueOnce({ data: session, error: null })

    storageBucket.createSignedUploadUrl.mockResolvedValue({
      data: { signedUrl: 'https://example.com/signed', path: 'path/file.webp', token: 'tok' },
      error: null,
    })

    const result = await initiateUpload({
      fileName: 'photo.webp',
      mimeType: 'image/webp',
      fileSize: 2048,
    })

    expect(result.signedUrl).toBe('https://example.com/signed')
  })
})

describe('initiateUpload', () => {
  let initiateUpload: typeof import('@/src/lib/services/upload.service').initiateUpload
  let UploadServiceError: typeof import('@/src/lib/services/upload.service').UploadServiceError

  beforeEach(async () => {
    vi.restoreAllMocks()
    const mod = await import('@/src/lib/services/upload.service')
    initiateUpload = mod.initiateUpload
    UploadServiceError = mod.UploadServiceError
  })

  it('creates new session when no cookie exists', async () => {
    const { chainable, storageBucket } = createMockSupabaseClient()
    vi.mocked(createAdminClient).mockReturnValue(chainable as any)

    const session = makeSession()
    const mockCookieStore = { get: vi.fn().mockReturnValue(undefined), set: vi.fn() }
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as any)

    // No cookie -> session insert
    chainable.single.mockResolvedValueOnce({ data: session, error: null })

    storageBucket.createSignedUploadUrl.mockResolvedValue({
      data: { signedUrl: 'https://signed.url', path: 'some/path.png', token: 'token123' },
      error: null,
    })

    const result = await initiateUpload(validMetadata)

    // Verify session was inserted (from -> insert chain was used)
    expect(chainable.insert).toHaveBeenCalled()
    // Cookie was set
    expect(mockCookieStore.set).toHaveBeenCalledWith(
      'ai-stickies-session',
      expect.any(String),
      expect.objectContaining({ httpOnly: true, path: '/' })
    )
    expect(result.signedUrl).toBe('https://signed.url')
    expect(result.token).toBe('token123')
    expect(result.remainingGenerations).toBe(10)
  })

  it('reuses existing session from cookie', async () => {
    const { chainable, storageBucket } = createMockSupabaseClient()
    vi.mocked(createAdminClient).mockReturnValue(chainable as any)

    const session = makeSession({ generation_count: 3 })
    const mockCookieStore = {
      get: vi.fn().mockReturnValue({ value: TEST_SESSION_ID }),
      set: vi.fn(),
    }
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as any)

    // Cookie exists -> select session by id -> single returns session
    chainable.single.mockResolvedValueOnce({ data: session, error: null })

    storageBucket.createSignedUploadUrl.mockResolvedValue({
      data: { signedUrl: 'https://signed.url', path: `${TEST_SESSION_ID}/123.png`, token: 'tok' },
      error: null,
    })

    const result = await initiateUpload(validMetadata)

    // Should NOT have called insert since session already exists
    expect(chainable.insert).not.toHaveBeenCalled()
    expect(result.sessionId).toBe(TEST_SESSION_ID)
    expect(result.remainingGenerations).toBe(7)
  })

  it('returns signed URL and storage path', async () => {
    const { chainable, storageBucket } = createMockSupabaseClient()
    vi.mocked(createAdminClient).mockReturnValue(chainable as any)

    const session = makeSession()
    const mockCookieStore = { get: vi.fn().mockReturnValue(undefined), set: vi.fn() }
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as any)

    chainable.single.mockResolvedValueOnce({ data: session, error: null })

    storageBucket.createSignedUploadUrl.mockResolvedValue({
      data: {
        signedUrl: 'https://storage.example.com/signed-upload',
        path: 'session-abc/12345.png',
        token: 'upload-token',
      },
      error: null,
    })

    const result = await initiateUpload(validMetadata)

    expect(result).toMatchObject({
      signedUrl: 'https://storage.example.com/signed-upload',
      storagePath: 'session-abc/12345.png',
      token: 'upload-token',
    })
    // Verify createSignedUploadUrl was called on the correct bucket
    expect(storageBucket.createSignedUploadUrl).toHaveBeenCalled()
    expect(chainable.storage.from).toHaveBeenCalledWith('uploads')
  })

  it('throws UploadServiceError(403) when no generations remaining', async () => {
    const { chainable } = createMockSupabaseClient()
    vi.mocked(createAdminClient).mockReturnValue(chainable as any)

    const exhaustedSession = makeSession({
      generation_count: 10,
      max_generations: 10,
    })

    const mockCookieStore = {
      get: vi.fn().mockReturnValue({ value: TEST_SESSION_ID }),
      set: vi.fn(),
    }
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as any)

    chainable.single.mockResolvedValue({ data: exhaustedSession, error: null })

    await expect(initiateUpload(validMetadata)).rejects.toThrow(UploadServiceError)
    await expect(initiateUpload(validMetadata)).rejects.toMatchObject({
      status: 403,
      message: expect.stringContaining('No generations remaining'),
    })
  })
})

describe('completeUpload', () => {
  let completeUpload: typeof import('@/src/lib/services/upload.service').completeUpload
  let UploadServiceError: typeof import('@/src/lib/services/upload.service').UploadServiceError

  beforeEach(async () => {
    vi.restoreAllMocks()
    const mod = await import('@/src/lib/services/upload.service')
    completeUpload = mod.completeUpload
    UploadServiceError = mod.UploadServiceError
  })

  const validInput = {
    storagePath: `${TEST_SESSION_ID}/123456.png`,
    fileName: 'photo.png',
    mimeType: 'image/png',
    fileSize: 1024,
  }

  it('throws UploadServiceError(401) when no session cookie', async () => {
    const mockCookieStore = { get: vi.fn().mockReturnValue(undefined), set: vi.fn() }
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as any)

    await expect(completeUpload(validInput)).rejects.toThrow(UploadServiceError)
    await expect(completeUpload(validInput)).rejects.toMatchObject({
      status: 401,
      message: expect.stringContaining('No session'),
    })
  })

  it('throws UploadServiceError(401) when session not found in DB', async () => {
    const { chainable } = createMockSupabaseClient()
    vi.mocked(createAdminClient).mockReturnValue(chainable as any)

    const mockCookieStore = {
      get: vi.fn().mockReturnValue({ value: TEST_SESSION_ID }),
      set: vi.fn(),
    }
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as any)

    // Session lookup returns null (not found)
    chainable.single.mockResolvedValueOnce({ data: null, error: { message: 'not found' } })

    await expect(completeUpload(validInput)).rejects.toThrow(UploadServiceError)
    await expect(completeUpload(validInput)).rejects.toMatchObject({
      status: 401,
      message: expect.stringContaining('Invalid session'),
    })
  })

  it('throws UploadServiceError(403) when storagePath does not start with sessionId', async () => {
    const { chainable } = createMockSupabaseClient()
    vi.mocked(createAdminClient).mockReturnValue(chainable as any)

    const session = makeSession()
    const mockCookieStore = {
      get: vi.fn().mockReturnValue({ value: TEST_SESSION_ID }),
      set: vi.fn(),
    }
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as any)

    // Session lookup succeeds (use mockResolvedValue so both calls work)
    chainable.single.mockResolvedValue({ data: session, error: null })

    const invalidPathInput = {
      ...validInput,
      storagePath: 'wrong-session-id/123456.png',
    }

    await expect(completeUpload(invalidPathInput)).rejects.toThrow(UploadServiceError)
    await expect(completeUpload(invalidPathInput)).rejects.toMatchObject({
      status: 403,
      message: expect.stringContaining('Invalid upload path'),
    })
  })

  it('returns existing upload record if already completed (idempotent)', async () => {
    const { chainable, storageBucket } = createMockSupabaseClient()
    vi.mocked(createAdminClient).mockReturnValue(chainable as any)

    const session = makeSession({ generation_count: 2 })
    const existingUpload = makeUpload()

    const mockCookieStore = {
      get: vi.fn().mockReturnValue({ value: TEST_SESSION_ID }),
      set: vi.fn(),
    }
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as any)

    // Session lookup succeeds
    chainable.single.mockResolvedValueOnce({ data: session, error: null })
    // getExistingUpload finds existing record
    chainable.maybeSingle.mockResolvedValueOnce({ data: existingUpload, error: null })

    const result = await completeUpload(validInput)

    expect(result.uploadId).toBe('upload-id-1')
    expect(result.sessionId).toBe(TEST_SESSION_ID)
    expect(result.remainingGenerations).toBe(8)
    expect(result.previewUrl).toBe('https://example.com/public/test.png')
    // Should NOT have tried to insert a new upload record
    expect(chainable.insert).not.toHaveBeenCalled()
  })

  it('creates new upload record and returns response', async () => {
    const { chainable, storageBucket } = createMockSupabaseClient()
    vi.mocked(createAdminClient).mockReturnValue(chainable as any)

    const session = makeSession({ generation_count: 1 })
    const newUpload = makeUpload({ id: 'new-upload-id' })

    const mockCookieStore = {
      get: vi.fn().mockReturnValue({ value: TEST_SESSION_ID }),
      set: vi.fn(),
    }
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as any)

    // Session lookup succeeds
    chainable.single
      .mockResolvedValueOnce({ data: session, error: null }) // session lookup
      .mockResolvedValueOnce({ data: newUpload, error: null }) // upload insert

    // getExistingUpload -> no existing upload
    chainable.maybeSingle.mockResolvedValueOnce({ data: null, error: null })

    // ensureUploadExists -> storage.list finds the file
    storageBucket.list.mockResolvedValue({
      data: [{ name: '123456.png' }],
      error: null,
    })

    const result = await completeUpload(validInput)

    expect(result.uploadId).toBe('new-upload-id')
    expect(result.sessionId).toBe(TEST_SESSION_ID)
    expect(result.remainingGenerations).toBe(9)
    expect(result.previewUrl).toBe('https://example.com/public/test.png')
    // Verify insert was called
    expect(chainable.insert).toHaveBeenCalled()
    // Verify file existence was checked
    expect(storageBucket.list).toHaveBeenCalled()
  })
})
