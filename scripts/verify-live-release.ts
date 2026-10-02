/** Opt-in real integration check. Creates disposable data and spends at most $0.60 on images (normally $0.30). */
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { readFile, writeFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import sharp from 'sharp'

const base = process.env.LIVE_E2E_URL
if (!base)
  throw new Error(
    'Set LIVE_E2E_URL explicitly to run the paid integration check',
  )
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
)
const email = `release-${randomUUID()}@example.com`
const password = randomUUID() + randomUUID()
const { data: created, error: createError } = await admin.auth.admin.createUser(
  { email, password, email_confirm: true },
)
if (createError || !created.user) throw createError ?? new Error('No test user')
const userId = created.user.id
const jar = new Map<string, string>()
const client = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  {
    cookies: {
      getAll: () => Array.from(jar, ([name, value]) => ({ name, value })),
      setAll: (cs) => cs.forEach((c) => jar.set(c.name, c.value)),
    },
  },
)
let sessionId: string | undefined
let generationId: string | undefined
async function api(path: string, init?: RequestInit) {
  const response = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      ...init?.headers,
      Cookie: Array.from(jar, ([k, v]) => `${k}=${v}`).join('; '),
    },
  })
  for (const cookie of response.headers.getSetCookie()) {
    const [pair] = cookie.split(';')
    const at = pair.indexOf('=')
    jar.set(pair.slice(0, at), pair.slice(at + 1))
  }
  return response
}
async function json(path: string, body?: unknown) {
  const r = await api(
    path,
    body === undefined
      ? undefined
      : {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
  )
  const data = await r.json()
  if (!r.ok) throw new Error(`${path}: ${r.status} ${JSON.stringify(data)}`)
  return data
}
try {
  const { error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw error
  const form = new FormData()
  form.set(
    'file',
    new File(
      [await readFile('public/stickers/chibi/01.png')],
      'reference.png',
      { type: 'image/png' },
    ),
  )
  const uploaded = await api('/api/upload', { method: 'POST', body: form })
  const upload = await uploaded.json()
  if (!uploaded.ok) throw new Error(JSON.stringify(upload))
  sessionId = upload.sessionId
  console.log('Upload passed')
  const started = Date.now()
  const previews = await json('/api/generate/previews', {
    uploadId: upload.uploadId,
    language: 'en',
    styleDescription:
      'The reference character, with dark hair and a white shirt',
  })
  generationId = previews.generationId
  if (previews.previews.length !== 5)
    throw new Error(`Expected five previews, got ${previews.previews.length}`)
  console.log(
    'Five previews passed in',
    Math.round((Date.now() - started) / 1000),
    'seconds',
  )
  const selected =
    previews.previews.find(
      (p: { fidelityLevel: string }) => p.fidelityLevel === 'chibi',
    ) ?? previews.previews[0]
  await json('/api/generate/packs', {
    generationId,
    selectedStyleIds: [selected.id],
  })
  let results
  const deadline = Date.now() + 280000
  do {
    await new Promise((r) => setTimeout(r, 3000))
    results = await json(`/api/generations/${generationId}/results`)
  } while (
    ['processing', 'pending'].includes(results.status) &&
    Date.now() < deadline
  )
  if (
    results.status !== 'completed' ||
    results.packs[0]?.stickers.length !== 10
  )
    throw new Error(
      `Incomplete pack: ${JSON.stringify(results.errors)} ${results.status}`,
    )
  const pack = results.packs[0]
  if (!pack.zipUrl || !(await fetch(pack.zipUrl)).ok) throw new Error('Stored pack ZIP is unavailable')
  for (const sticker of pack.stickers) {
    const r = await fetch(sticker.imageUrl)
    if (!r.ok) throw new Error('Image not accessible')
    const buffer = Buffer.from(await r.arrayBuffer())
    const metadata = await sharp(buffer).metadata()
    const stats = await sharp(buffer).stats()
    if (
      metadata.format !== 'png' ||
      metadata.width! > 370 ||
      metadata.height! > 320 ||
      buffer.length > 300 * 1024 ||
      stats.isOpaque
    )
      throw new Error(
        'Sticker violates format, size, or transparency requirements',
      )
  }
  const downloaded = await api(`/api/packs/${pack.id}/download`)
  if (!downloaded.ok) throw new Error('Download failed')
  const zip = Buffer.from(await downloaded.arrayBuffer())
  if (zip.toString('ascii', 0, 2) !== 'PK') throw new Error('Invalid ZIP')
  await writeFile('/tmp/ai-stickies-live-pack.zip', zip)
  const denied = await fetch(`${base}/api/packs/${pack.id}/download`)
  if (![401, 403].includes(denied.status))
    throw new Error(`Private download allowed: ${denied.status}`)
  const balance = await admin
    .from('profiles')
    .select('credit_balance')
    .eq('id', userId)
    .single()
  if (balance.data?.credit_balance !== 2)
    throw new Error('Expected exactly one pack credit charged')
  const duplicate = await api('/api/generate/packs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ generationId, selectedStyleIds: [selected.id] }),
  })
  if (duplicate.status !== 409)
    throw new Error('Duplicate pack request was not rejected')
  console.log(
    'PASS: 5 previews, 10 transparent stickers, ZIP download, private access, duplicate prevention, one credit charged.',
    {
      generationId,
      elapsedSeconds: Math.round((Date.now() - started) / 1000),
      normalImageCostUsd: 0.3,
      maximumImageCostUsd: 0.6,
    },
  )
} finally {
  await client.auth.signOut()
  if (sessionId) {
    const uploads = await admin
      .from('uploads')
      .select('storage_path')
      .eq('session_id', sessionId)
    if (uploads.data?.length)
      await admin.storage
        .from('uploads')
        .remove(uploads.data.map((x) => x.storage_path))
  }
  if (generationId) {
    const previews = await admin
      .from('style_previews')
      .select('preview_storage_path')
      .eq('generation_id', generationId)
    const packs = await admin
      .from('sticker_packs')
      .select('id,zip_storage_path,marketplace_zip_path')
      .eq('generation_id', generationId)
    const paths = (previews.data ?? []).map((x) => x.preview_storage_path)
    for (const pack of packs.data ?? []) {
      const stickers = await admin
        .from('stickers')
        .select('storage_path')
        .eq('pack_id', pack.id)
      paths.push(...(stickers.data ?? []).map((x) => x.storage_path))
      if (pack.zip_storage_path) paths.push(pack.zip_storage_path)
      if (pack.marketplace_zip_path) paths.push(pack.marketplace_zip_path)
    }
    if (paths.length) await admin.storage.from('stickers').remove(paths)
  }
  if (sessionId) await admin.from('sessions').delete().eq('id', sessionId)
  await admin.auth.admin.deleteUser(userId)
  console.log('Disposable test account and artifacts removed')
}
