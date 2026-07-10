import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/src/lib/stripe/client', () => ({
  getStripe: vi.fn(),
}))

vi.mock('@/src/lib/services/credits.service', () => ({
  completePurchase: vi.fn(),
}))

import { POST } from '@/app/api/stripe/webhook/route'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { getStripe } from '@/src/lib/stripe/client'
import { completePurchase } from '@/src/lib/services/credits.service'

function webhookRequest() {
  return new Request('http://localhost:3000/api/stripe/webhook', {
    method: 'POST',
    headers: { 'stripe-signature': 'sig_test' },
    body: '{}',
  })
}

function mockStripeEvent(event: unknown) {
  vi.mocked(getStripe).mockReturnValue({
    webhooks: {
      constructEvent: vi.fn().mockReturnValue(event),
    },
  } as unknown as ReturnType<typeof getStripe>)
}

function purchaseLookupMock(purchase = {
  id: 'purchase-1',
  status: 'pending',
  user_id: 'user-1',
  credits_purchased: 10,
}) {
  const builder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: purchase, error: null }),
  }

  return {
    from: vi.fn(() => builder),
  }
}

describe('POST /api/stripe/webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(completePurchase).mockResolvedValue(10)
  })

  it('does not grant credits for unpaid checkout.session.completed events', async () => {
    mockStripeEvent({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_unpaid',
          payment_status: 'unpaid',
          metadata: { user_id: 'user-1', credit_pack_id: 'pack-1' },
        },
      },
    })

    const response = await POST(webhookRequest())

    expect(response.status).toBe(200)
    expect(completePurchase).not.toHaveBeenCalled()
    expect(createAdminClient).not.toHaveBeenCalled()
  })

  it('grants credits for paid checkout.session.completed events', async () => {
    mockStripeEvent({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_paid',
          payment_status: 'paid',
          metadata: { user_id: 'user-1', credit_pack_id: 'pack-1' },
        },
      },
    })
    vi.mocked(createAdminClient).mockReturnValue(
      purchaseLookupMock() as unknown as ReturnType<typeof createAdminClient>
    )

    const response = await POST(webhookRequest())

    expect(response.status).toBe(200)
    expect(completePurchase).toHaveBeenCalledWith('purchase-1')
  })

  it('grants credits for checkout.session.async_payment_succeeded events', async () => {
    mockStripeEvent({
      type: 'checkout.session.async_payment_succeeded',
      data: {
        object: {
          id: 'cs_async_paid',
          payment_status: 'paid',
          metadata: { user_id: 'user-1', credit_pack_id: 'pack-1' },
        },
      },
    })
    vi.mocked(createAdminClient).mockReturnValue(
      purchaseLookupMock() as unknown as ReturnType<typeof createAdminClient>
    )

    const response = await POST(webhookRequest())

    expect(response.status).toBe(200)
    expect(completePurchase).toHaveBeenCalledWith('purchase-1')
  })

  it('marks pending purchases failed for checkout.session.async_payment_failed events', async () => {
    mockStripeEvent({
      type: 'checkout.session.async_payment_failed',
      data: {
        object: {
          id: 'cs_failed',
          payment_status: 'unpaid',
        },
      },
    })

    const builder = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn(),
    }
    builder.eq
      .mockReturnValueOnce(builder)
      .mockResolvedValueOnce({ error: null })

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(() => builder),
    } as unknown as ReturnType<typeof createAdminClient>)

    const response = await POST(webhookRequest())

    expect(response.status).toBe(200)
    expect(builder.update).toHaveBeenCalledWith({ status: 'failed' })
    expect(builder.eq).toHaveBeenCalledWith('stripe_session_id', 'cs_failed')
    expect(builder.eq).toHaveBeenCalledWith('status', 'pending')
    expect(completePurchase).not.toHaveBeenCalled()
  })
})
