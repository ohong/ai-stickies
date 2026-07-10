import { getUser } from '@/src/lib/services/auth.service'
import { getSessionIdFromCookie } from '@/src/lib/services/session.service'
import { createAdminClient } from '@/src/lib/supabase/admin'
import type { Generation } from '@/src/types/database'

export interface RequestActor {
  userId: string | null
  sessionId: string | null
}

export class AuthorizationError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string
  ) {
    super(message)
    this.name = 'AuthorizationError'
  }
}

type GenerationOwner = Pick<Generation, 'session_id' | 'user_id'>

export async function getRequestActor(): Promise<RequestActor> {
  const [user, sessionId] = await Promise.all([
    getUser(),
    getSessionIdFromCookie(),
  ])

  return {
    userId: user?.id ?? null,
    sessionId,
  }
}

export function canAccessGeneration(
  generation: GenerationOwner,
  actor: RequestActor
): boolean {
  return (
    (actor.userId !== null && generation.user_id === actor.userId) ||
    (actor.sessionId !== null && generation.session_id === actor.sessionId)
  )
}

export async function requireGenerationAccess<T extends GenerationOwner>(
  generationId: string,
  select = '*'
): Promise<{ actor: RequestActor; generation: T }> {
  const actor = await getRequestActor()

  if (!actor.userId && !actor.sessionId) {
    throw new AuthorizationError('Session not found', 401, 'NO_SESSION')
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('generations')
    .select(select)
    .eq('id', generationId)
    .single()

  if (error || !data) {
    throw new AuthorizationError('Generation not found', 404, 'NOT_FOUND')
  }

  const generation = data as unknown as T
  if (!canAccessGeneration(generation, actor)) {
    throw new AuthorizationError('Access denied', 403, 'ACCESS_DENIED')
  }

  return { actor, generation }
}

export async function requirePackAccess<T extends { generations: GenerationOwner }>(
  packId: string,
  select: string
): Promise<{ actor: RequestActor; pack: T }> {
  const actor = await getRequestActor()

  if (!actor.userId && !actor.sessionId) {
    throw new AuthorizationError('Session not found', 401, 'NO_SESSION')
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('sticker_packs')
    .select(select)
    .eq('id', packId)
    .single()

  if (error || !data) {
    throw new AuthorizationError('Pack not found', 404, 'NOT_FOUND')
  }

  const pack = data as unknown as T
  if (!canAccessGeneration(pack.generations, actor)) {
    throw new AuthorizationError('Access denied', 403, 'ACCESS_DENIED')
  }

  return { actor, pack }
}
