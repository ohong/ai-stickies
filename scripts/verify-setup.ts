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

const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'SUPABASE_SECRET_KEY',
  'BFL_API_KEY',
  'FAL_API_KEY',
  'FIREWORKS_API_KEY',
]

const REQUIRED_TABLES = [
  'sessions',
  'uploads',
  'generations',
  'style_previews',
  'sticker_packs',
  'stickers',
]

const REQUIRED_BUCKETS = [
  { name: 'uploads', public: true },
  { name: 'stickers', public: true },
]

async function main() {
  console.log('🔍 Verifying AI Stickies Setup...\n')

  // Check environment variables
  console.log('1️⃣ Checking environment variables...')
  const missingVars = REQUIRED_ENV_VARS.filter(v => !process.env[v])

  if (missingVars.length > 0) {
    console.error('❌ Missing environment variables:')
    missingVars.forEach(v => console.error(`   - ${v}`))
    console.log('')
  } else {
    console.log('✅ All environment variables set\n')
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SECRET_KEY!

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Cannot verify Supabase without credentials')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // Check database tables
  console.log('2️⃣ Checking database tables...')

  for (const table of REQUIRED_TABLES) {
    try {
      const { error } = await supabase.from(table).select('id').limit(1)

      if (error) {
        console.error(`❌ Table '${table}' error: ${error.message}`)
      } else {
        console.log(`✅ Table '${table}' exists`)
      }
    } catch (err) {
      console.error(`❌ Failed to check table '${table}'`)
    }
  }
  console.log('')

  // Check storage buckets
  console.log('3️⃣ Checking storage buckets...')

  try {
    const { data: buckets, error } = await supabase.storage.listBuckets()

    if (error) {
      console.error(`❌ Failed to list buckets: ${error.message}`)
    } else {
      for (const required of REQUIRED_BUCKETS) {
        const bucket = buckets?.find(b => b.name === required.name)

        if (!bucket) {
          console.error(`❌ Bucket '${required.name}' missing`)
          console.log(`   Run: create-buckets.ts to create it`)
        } else {
          const publicMatch = bucket.public === required.public
          if (!publicMatch) {
            console.warn(`⚠️  Bucket '${required.name}' exists but public=${bucket.public} (expected ${required.public})`)
          } else {
            console.log(`✅ Bucket '${required.name}' configured correctly`)
          }
        }
      }
    }
  } catch (err) {
    console.error('❌ Failed to check storage buckets')
  }
  console.log('')

  // Summary
  console.log('📋 Summary:')
  console.log('If you see any ❌ errors above, run:')
  console.log('  bun scripts/setup-supabase.ts')
  console.log('')
  console.log('Then start the dev server:')
  console.log('  bun run dev')
}

main().catch(console.error)
