import { NextRequest, NextResponse } from 'next/server'
import { cleanupExpiredSessions } from '@/src/lib/services/session-cleanup'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const expectedSecret = process.env.CRON_SECRET
  const authorization = request.headers.get('authorization')

  if (!expectedSecret || authorization !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await cleanupExpiredSessions()

  if (result.error) {
    return NextResponse.json(result, { status: 500 })
  }

  return NextResponse.json(result)
}
