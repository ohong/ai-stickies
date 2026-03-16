import { NextResponse } from 'next/server'
import { requireAuth, migrateAnonymousSession } from '@/src/lib/services/auth.service'
import { getSessionIdFromCookie } from '@/src/lib/services/session.service'

export async function POST() {
  try {
    // Verify the user is actually authenticated
    const user = await requireAuth()

    // Get the anonymous session ID from the cookie
    const sessionId = await getSessionIdFromCookie()
    if (!sessionId) {
      return NextResponse.json({ success: true, migrated: false })
    }

    await migrateAnonymousSession(sessionId, user.id)

    return NextResponse.json({ success: true, migrated: true })
  } catch (error) {
    console.error('Session migration error:', error)
    return NextResponse.json(
      { success: false, error: 'Migration failed' },
      { status: 500 }
    )
  }
}
