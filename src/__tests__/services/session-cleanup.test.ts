import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { cleanupExpiredSessions } from '@/src/lib/services/session-cleanup'

function createBuilder(
  terminalMethod: 'is' | 'eq' | 'in',
  result: { data?: unknown; error?: { message: string } | null }
) {
  const builder = {
    select: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  }
  builder[terminalMethod] = vi.fn().mockResolvedValue({
    data: result.data ?? null,
    error: result.error ?? null,
  })
  return builder
}

describe('cleanupExpiredSessions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deletes only expired anonymous sessions without public packs and removes storage artifacts', async () => {
    const builders = [
      createBuilder('is', {
        data: [{ id: 'anon-safe' }, { id: 'anon-public' }],
      }),
      createBuilder('eq', {
        data: [{ session_id: 'anon-public' }],
      }),
      createBuilder('in', {
        data: [{ storage_path: 'anon-safe/photo.png' }],
      }),
      createBuilder('in', {
        data: [{ id: 'gen-safe' }],
      }),
      createBuilder('in', {
        data: [{ preview_storage_path: 'anon-safe/previews/gen-safe/high.png' }],
      }),
      createBuilder('in', {
        data: [{
          id: 'pack-safe',
          zip_storage_path: 'gen-safe/pack-safe/pack.zip',
          marketplace_zip_path: null,
        }],
      }),
      createBuilder('in', {
        data: [{ storage_path: 'gen-safe/pack-safe/01.png' }],
      }),
      createBuilder('in', { data: null }),
    ]

    const uploadRemove = vi.fn().mockResolvedValue({ error: null })
    const stickerRemove = vi.fn().mockResolvedValue({ error: null })
    const supabase = {
      from: vi.fn(() => builders.shift()),
      storage: {
        from: vi.fn((bucket: string) => ({
          remove: bucket === 'uploads' ? uploadRemove : stickerRemove,
        })),
      },
    }
    vi.mocked(createAdminClient).mockReturnValue(
      supabase as unknown as ReturnType<typeof createAdminClient>
    )

    const result = await cleanupExpiredSessions()

    expect(result).toEqual({ deletedCount: 1, error: null })
    expect(uploadRemove).toHaveBeenCalledWith(['anon-safe/photo.png'])
    expect(stickerRemove).toHaveBeenCalledWith([
      'anon-safe/previews/gen-safe/high.png',
      'gen-safe/pack-safe/pack.zip',
      'gen-safe/pack-safe/01.png',
    ])
    expect(supabase.from).toHaveBeenLastCalledWith('sessions')
  })
})
