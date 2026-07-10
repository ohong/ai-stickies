import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createAdminClient } from '@/src/lib/supabase/admin'

let addCredits: typeof import('@/src/lib/services/credits.service').addCredits
let completePurchase: typeof import('@/src/lib/services/credits.service').completePurchase
let deductCredits: typeof import('@/src/lib/services/credits.service').deductCredits
let refundPackGenerationCharge: typeof import('@/src/lib/services/credits.service').refundPackGenerationCharge
let startPackGenerationCharge: typeof import('@/src/lib/services/credits.service').startPackGenerationCharge

beforeEach(async () => {
  vi.clearAllMocks()
  const mod = await import('@/src/lib/services/credits.service')
  addCredits = mod.addCredits
  completePurchase = mod.completePurchase
  deductCredits = mod.deductCredits
  refundPackGenerationCharge = mod.refundPackGenerationCharge
  startPackGenerationCharge = mod.startPackGenerationCharge
})

describe('credits.service atomic mutations', () => {
  it('deductCredits calls the deduct_credits RPC once', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: 7, error: null })
    vi.mocked(createAdminClient).mockReturnValue({ rpc } as unknown as ReturnType<typeof createAdminClient>)

    await expect(deductCredits('user-1', 3)).resolves.toBe(7)

    expect(rpc).toHaveBeenCalledTimes(1)
    expect(rpc).toHaveBeenCalledWith('deduct_credits', {
      p_user_id: 'user-1',
      p_amount: 3,
    })
  })

  it('deductCredits normalizes insufficient credit errors', async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'INSUFFICIENT_CREDITS' },
    })
    vi.mocked(createAdminClient).mockReturnValue({ rpc } as unknown as ReturnType<typeof createAdminClient>)

    await expect(deductCredits('user-1', 5)).rejects.toThrow('Insufficient credits')
  })

  it('addCredits calls the add_credits RPC once', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: 12, error: null })
    vi.mocked(createAdminClient).mockReturnValue({ rpc } as unknown as ReturnType<typeof createAdminClient>)

    await expect(addCredits('user-1', 10)).resolves.toBe(12)

    expect(rpc).toHaveBeenCalledWith('add_credits', {
      p_user_id: 'user-1',
      p_amount: 10,
    })
  })

  it('completePurchase delegates grant and status update to one RPC', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: 23, error: null })
    vi.mocked(createAdminClient).mockReturnValue({ rpc } as unknown as ReturnType<typeof createAdminClient>)

    await expect(completePurchase('purchase-1')).resolves.toBe(23)

    expect(rpc).toHaveBeenCalledTimes(1)
    expect(rpc).toHaveBeenCalledWith('complete_purchase', {
      p_purchase_id: 'purchase-1',
    })
  })

  it('startPackGenerationCharge delegates lock, quota, and credits to one RPC', async () => {
    const generation = {
      id: 'gen-1',
      session_id: 'session-1',
      user_id: 'user-1',
      status: 'processing',
    }
    const rpc = vi.fn().mockResolvedValue({ data: generation, error: null })
    vi.mocked(createAdminClient).mockReturnValue({ rpc } as unknown as ReturnType<typeof createAdminClient>)

    await expect(startPackGenerationCharge({
      generationId: 'gen-1',
      sessionId: 'session-1',
      userId: 'user-1',
      packCount: 2,
    })).resolves.toBe(generation)

    expect(rpc).toHaveBeenCalledWith('start_pack_generation', {
      p_generation_id: 'gen-1',
      p_session_id: 'session-1',
      p_user_id: 'user-1',
      p_pack_count: 2,
    })
  })

  it('refundPackGenerationCharge delegates credit and quota refund to one RPC', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: 2, error: null })
    vi.mocked(createAdminClient).mockReturnValue({ rpc } as unknown as ReturnType<typeof createAdminClient>)

    await expect(refundPackGenerationCharge('gen-1', 2)).resolves.toBe(2)

    expect(rpc).toHaveBeenCalledWith('refund_pack_generation', {
      p_generation_id: 'gen-1',
      p_amount: 2,
    })
  })
})
