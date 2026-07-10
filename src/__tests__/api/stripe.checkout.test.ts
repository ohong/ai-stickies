import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/src/lib/stripe/client', () => ({
  getStripe: vi.fn(),
}))

import { POST } from '@/app/api/stripe/checkout/route'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { createClient } from '@/src/lib/supabase/server'
import { getStripe } from '@/src/lib/stripe/client'

function createRequest(body: unknown) {
  return new NextRequest('http://localhost:3000/api/stripe/checkout', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: 'http://localhost:3000',
    },
    body: JSON.stringify(body),
  })
}

function createBuilder(result: { data?: unknown; error?: { message: string } | null } = {}) {
  const builder: Record<string, ReturnType<typeof vi.fn>> = {}
  const proxy = new Proxy(builder, {
    get(target, prop: string) {
      if (!target[prop]) target[prop] = vi.fn().mockReturnValue(proxy)
      return target[prop]
    },
  }) as Record<string, ReturnType<typeof vi.fn>>
  proxy.single = vi.fn().mockResolvedValue({ data: result.data ?? null, error: result.error ?? null })
  return proxy
}

describe('POST /api/stripe/checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-1', email: 'user@example.com' } },
          error: null,
        }),
      },
    } as unknown as Awaited<ReturnType<typeof createClient>>)

    vi.mocked(getStripe).mockReturnValue({
      checkout: {
        sessions: {
          create: vi.fn().mockResolvedValue({ id: 'cs_test_1', url: 'https://stripe.test/checkout' }),
        },
      },
      customers: {
        create: vi.fn().mockResolvedValue({ id: 'cus_1' }),
      },
    } as unknown as ReturnType<typeof getStripe>)
  })

  it('returns 500 when the pending purchase record cannot be created', async () => {
    const packBuilder = createBuilder({
      data: {
        id: 'pack-1',
        credits: 10,
        price_cents: 499,
        stripe_price_id: 'price_123',
      },
    })
    const profileBuilder = createBuilder({
      data: { stripe_customer_id: 'cus_existing' },
    })
    const purchaseBuilder = createBuilder()
    purchaseBuilder.insert = vi.fn().mockResolvedValue({ error: { message: 'insert failed' } })

    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'credit_packs') return packBuilder
        if (table === 'profiles') return profileBuilder
        if (table === 'purchases') return purchaseBuilder
        return createBuilder()
      }),
    }
    vi.mocked(createAdminClient).mockReturnValue(supabase as unknown as ReturnType<typeof createAdminClient>)

    const response = await POST(createRequest({ creditPackId: 'pack-1' }))
    const json = await response.json()

    expect(response.status).toBe(500)
    expect(json.error).toBe('Failed to create purchase record')
  })
})
