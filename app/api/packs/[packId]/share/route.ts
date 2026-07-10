/**
 * Pack Share API
 * POST /api/packs/{packId}/share — publish pack (requires session auth)
 * DELETE /api/packs/{packId}/share — unpublish pack (requires session auth)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getRequestActor } from '@/src/lib/services/authorization.service'
import { publishPack, unpublishPack } from '@/src/lib/services/share.service'
import { getShareUrl } from '@/src/lib/utils/share'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ packId: string }> }
): Promise<NextResponse> {
  try {
    const actor = await getRequestActor()
    if (!actor.sessionId && !actor.userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { packId } = await params
    const { slug } = await publishPack(packId, actor.sessionId, actor.userId)

    return NextResponse.json({
      slug,
      shareUrl: getShareUrl(slug),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to publish'
    const status = message === 'Access denied' ? 403 : message === 'Pack not found' ? 404 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ packId: string }> }
): Promise<NextResponse> {
  try {
    const actor = await getRequestActor()
    if (!actor.sessionId && !actor.userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { packId } = await params
    await unpublishPack(packId, actor.sessionId, actor.userId)

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to unpublish'
    const status = message === 'Access denied' ? 403 : message === 'Pack not found' ? 404 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
