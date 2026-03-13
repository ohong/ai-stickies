import { cookies } from 'next/headers'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE } from '@/src/lib/constants/session'
import { storageConfig, sessionConfig } from '@/src/lib/config'
import type { Session, Upload } from '@/src/types/database'

interface UploadMetadata {
  fileName: string
  mimeType: string
  fileSize: number
}

interface FinalizeUploadInput extends UploadMetadata {
  storagePath: string
}

interface SessionContext {
  session: Session
  sessionId: string
  supabase: ReturnType<typeof createAdminClient>
}

export interface InitiateUploadResult {
  sessionId: string
  remainingGenerations: number
  signedUrl: string
  storagePath: string
  token: string
}

export interface CompleteUploadResult {
  uploadId: string
  previewUrl: string
  sessionId: string
  remainingGenerations: number
}

export class UploadServiceError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message)
    this.name = 'UploadServiceError'
  }
}

function validateUploadMetadata({ fileSize, mimeType }: UploadMetadata): void {
  if (!storageConfig.allowedMimeTypes.includes(mimeType)) {
    throw new UploadServiceError(
      'Invalid file type. Please upload a JPG, PNG, or WebP image.',
      400
    )
  }

  const maxSizeBytes = storageConfig.maxUploadSizeMb * 1024 * 1024
  if (fileSize > maxSizeBytes) {
    throw new UploadServiceError(
      `File size must be less than ${storageConfig.maxUploadSizeMb}MB`,
      400
    )
  }
}

function inferExtension(fileName: string, mimeType: string): string {
  const rawExtension = fileName.split('.').pop()
  const fromName = rawExtension
    ? rawExtension.toLowerCase().replace(/[^a-z0-9]/g, '')
    : undefined

  if (fromName) {
    return fromName
  }

  switch (mimeType) {
    case 'image/png':
      return 'png'
    case 'image/webp':
      return 'webp'
    default:
      return 'jpg'
  }
}

async function setSessionCookie(sessionId: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  })
}

async function getOrCreateSessionContext(): Promise<SessionContext> {
  const cookieStore = await cookies()
  const supabase = createAdminClient()

  let sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value
  let session: Session | null = null

  if (sessionId) {
    const { data } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    session = data
  }

  if (!session) {
    sessionId = crypto.randomUUID()
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        id: sessionId,
        generation_count: 0,
        max_generations: sessionConfig.maxGenerations,
      })
      .select()
      .single()

    if (error || !data) {
      throw new UploadServiceError('Failed to create session', 500)
    }

    session = data
  }

  await setSessionCookie(sessionId)

  return {
    session,
    sessionId,
    supabase,
  }
}

async function getSessionContextFromCookie(): Promise<SessionContext> {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!sessionId) {
    throw new UploadServiceError('No session found', 401)
  }

  const supabase = createAdminClient()
  const { data: session, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (error || !session) {
    throw new UploadServiceError('Invalid session', 401)
  }

  await setSessionCookie(sessionId)

  return {
    session,
    sessionId,
    supabase,
  }
}

function getRemainingGenerations(session: Session): number {
  return session.max_generations - session.generation_count
}

function assertRemainingGenerations(session: Session): number {
  const remaining = getRemainingGenerations(session)

  if (remaining <= 0) {
    throw new UploadServiceError('No generations remaining in this session', 403)
  }

  return remaining
}

function createStoragePath(sessionId: string, metadata: UploadMetadata): string {
  const timestamp = Date.now()
  const extension = inferExtension(metadata.fileName, metadata.mimeType)
  return `${sessionId}/${timestamp}.${extension}`
}

async function ensureUploadExists(
  supabase: ReturnType<typeof createAdminClient>,
  storagePath: string
): Promise<void> {
  const lastSlashIndex = storagePath.lastIndexOf('/')
  const folder = lastSlashIndex >= 0 ? storagePath.slice(0, lastSlashIndex) : ''
  const fileName = lastSlashIndex >= 0 ? storagePath.slice(lastSlashIndex + 1) : storagePath

  const { data, error } = await supabase.storage
    .from(storageConfig.uploadBucket)
    .list(folder, { limit: 10, search: fileName })

  if (error) {
    throw new UploadServiceError('Failed to verify uploaded file', 500)
  }

  const fileExists = data?.some(file => file.name === fileName)
  if (!fileExists) {
    throw new UploadServiceError('Uploaded file not found', 404)
  }
}

async function getExistingUpload(
  supabase: ReturnType<typeof createAdminClient>,
  sessionId: string,
  storagePath: string
): Promise<Upload | null> {
  const { data, error } = await supabase
    .from('uploads')
    .select('*')
    .eq('session_id', sessionId)
    .eq('storage_path', storagePath)
    .maybeSingle()

  if (error) {
    throw new UploadServiceError('Failed to verify upload record', 500)
  }

  return data
}

async function updateSessionActivity(
  supabase: ReturnType<typeof createAdminClient>,
  sessionId: string
): Promise<void> {
  await supabase
    .from('sessions')
    .update({ last_active_at: new Date().toISOString() })
    .eq('id', sessionId)
}

function buildUploadResponse(
  session: Session,
  sessionId: string,
  uploadId: string,
  storagePath: string,
  supabase: ReturnType<typeof createAdminClient>
): CompleteUploadResult {
  const { data } = supabase.storage
    .from(storageConfig.uploadBucket)
    .getPublicUrl(storagePath)

  return {
    uploadId,
    previewUrl: data.publicUrl,
    sessionId,
    remainingGenerations: getRemainingGenerations(session),
  }
}

async function persistUploadRecord(
  context: SessionContext,
  input: FinalizeUploadInput,
  options: { verifyObject: boolean; removeOnInsertFailure: boolean }
): Promise<CompleteUploadResult> {
  const { session, sessionId, supabase } = context

  if (!input.storagePath.startsWith(`${sessionId}/`)) {
    throw new UploadServiceError('Invalid upload path', 403)
  }

  const existingUpload = await getExistingUpload(supabase, sessionId, input.storagePath)
  if (existingUpload) {
    await updateSessionActivity(supabase, sessionId)
    return buildUploadResponse(
      session,
      sessionId,
      existingUpload.id,
      input.storagePath,
      supabase
    )
  }

  if (options.verifyObject) {
    await ensureUploadExists(supabase, input.storagePath)
  }

  const { data: upload, error } = await supabase
    .from('uploads')
    .insert({
      session_id: sessionId,
      storage_path: input.storagePath,
      original_filename: input.fileName,
      mime_type: input.mimeType,
      size_bytes: input.fileSize,
    })
    .select()
    .single()

  if (error || !upload) {
    if (options.removeOnInsertFailure) {
      await supabase.storage.from(storageConfig.uploadBucket).remove([input.storagePath])
    }

    throw new UploadServiceError('Failed to save upload record', 500)
  }

  await updateSessionActivity(supabase, sessionId)

  return buildUploadResponse(session, sessionId, upload.id, input.storagePath, supabase)
}

export async function initiateUpload(
  metadata: UploadMetadata
): Promise<InitiateUploadResult> {
  validateUploadMetadata(metadata)

  const context = await getOrCreateSessionContext()
  const remainingGenerations = assertRemainingGenerations(context.session)
  const storagePath = createStoragePath(context.sessionId, metadata)

  const { data, error } = await context.supabase.storage
    .from(storageConfig.uploadBucket)
    .createSignedUploadUrl(storagePath)

  if (error || !data) {
    throw new UploadServiceError('Failed to prepare upload', 500)
  }

  return {
    sessionId: context.sessionId,
    remainingGenerations,
    signedUrl: data.signedUrl,
    storagePath: data.path,
    token: data.token,
  }
}

export async function completeUpload(
  input: FinalizeUploadInput
): Promise<CompleteUploadResult> {
  validateUploadMetadata(input)

  const context = await getSessionContextFromCookie()

  return persistUploadRecord(context, input, {
    verifyObject: true,
    removeOnInsertFailure: true,
  })
}

export async function uploadFile(file: File): Promise<CompleteUploadResult> {
  validateUploadMetadata({
    fileName: file.name,
    mimeType: file.type,
    fileSize: file.size,
  })

  const context = await getOrCreateSessionContext()
  assertRemainingGenerations(context.session)

  const storagePath = createStoragePath(context.sessionId, {
    fileName: file.name,
    mimeType: file.type,
    fileSize: file.size,
  })

  const arrayBuffer = await file.arrayBuffer()
  const buffer = new Uint8Array(arrayBuffer)

  const { error } = await context.supabase.storage
    .from(storageConfig.uploadBucket)
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    })

  if (error) {
    throw new UploadServiceError('Failed to upload file', 500)
  }

  return persistUploadRecord(
    context,
    {
      storagePath,
      fileName: file.name,
      mimeType: file.type,
      fileSize: file.size,
    },
    {
      verifyObject: false,
      removeOnInsertFailure: true,
    }
  )
}
