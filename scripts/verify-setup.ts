#!/usr/bin/env bun
/**
 * Verify Supabase Setup
 *
 * Checks that all required infrastructure is in place:
 * - Database tables exist
 * - Storage buckets exist and are configured correctly
 * - Environment variables are set
 */

import { createClient } from '@supabase/supabase-js'
import { lookup } from 'node:dns/promises'

const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'SUPABASE_SECRET_KEY',
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
]

const IMAGE_PROVIDER_ENV_VARS = [
  'FAL_API_KEY',
  'BFL_API_KEY',
  'OPENAI_API_KEY',
]

const REQUIRED_TABLES = [
  'profiles',
  'sessions',
  'uploads',
  'generations',
  'style_previews',
  'sticker_packs',
  'stickers',
  'credit_packs',
  'purchases',
]

const REQUIRED_BUCKETS = [
  { name: 'uploads', public: false },
  { name: 'stickers', public: false },
]

async function main() {
  console.log('Verifying AI Stickies Setup...\n')
  let failureCount = 0

  const fail = (message: string) => {
    failureCount += 1
    console.error(message)
  }

  // Check environment variables
  console.log('1. Checking environment variables...')
  const missingVars = REQUIRED_ENV_VARS.filter(v => !process.env[v])
  const hasImageProvider = IMAGE_PROVIDER_ENV_VARS.some(v => Boolean(process.env[v]))

  if (missingVars.length > 0) {
    fail('Missing environment variables:')
    missingVars.forEach(v => console.error(`   - ${v}`))
    console.log('')
  } else {
    console.log('All environment variables set\n')
  }

  if (!hasImageProvider) {
    fail(`Missing image provider key. Set at least one of: ${IMAGE_PROVIDER_ENV_VARS.join(', ')}`)
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SECRET_KEY
  let parsedSupabaseUrl: URL | null = null

  if (supabaseUrl) {
    try {
      parsedSupabaseUrl = new URL(supabaseUrl)
      console.log(`Supabase host: ${parsedSupabaseUrl.hostname}`)
      await lookup(parsedSupabaseUrl.hostname)
      console.log('Supabase host resolves\n')
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error)
      fail(`Supabase URL is not reachable: ${detail}`)
      console.error('   Confirm NEXT_PUBLIC_SUPABASE_URL matches the Dashboard API URL and the Supabase project is active.')
      console.log('')
    }
  }

  if (!supabaseUrl || !supabaseKey || !parsedSupabaseUrl || failureCount > 0) {
    console.error('Cannot complete setup verification until required configuration is present')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // Check database tables
  console.log('2. Checking database tables...')

  for (const table of REQUIRED_TABLES) {
    try {
      const { error } = await supabase.from(table).select('id').limit(1)

      if (error) {
        fail(`Table '${table}' error: ${error.message}`)
      } else {
        console.log(`Table '${table}' exists`)
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error)
      fail(`Failed to check table '${table}': ${detail}`)
    }
  }
  console.log('')

  // Check storage buckets
  console.log('3. Checking storage buckets...')

  try {
    const { data: buckets, error } = await supabase.storage.listBuckets()

    if (error) {
      fail(`Failed to list buckets: ${error.message}`)
    } else {
      for (const required of REQUIRED_BUCKETS) {
        const bucket = buckets?.find(b => b.name === required.name)

        if (!bucket) {
          fail(`Bucket '${required.name}' missing`)
          console.log(`   Run: create-buckets.ts to create it`)
        } else {
          const publicMatch = bucket.public === required.public
          if (!publicMatch) {
            fail(`Bucket '${required.name}' exists but public=${bucket.public} (expected ${required.public})`)
          } else {
            console.log(`Bucket '${required.name}' configured correctly`)
          }
        }
      }
    }
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    fail(`Failed to check storage buckets: ${detail}`)
  }
  console.log('')

  // Summary
  if (failureCount > 0) {
    console.error(`Setup verification failed with ${failureCount} issue(s).`)
    console.error('Fix the errors above, then rerun:')
    console.error('  bun scripts/verify-setup.ts')
    process.exit(1)
  }

  console.log('Summary: setup verification passed.')
  console.log('If you need to recreate local infrastructure, run:')
  console.log('  bun scripts/setup-supabase.ts')
  console.log('')
  console.log('Then start the dev server:')
  console.log('  bun run dev')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
