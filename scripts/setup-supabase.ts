#!/usr/bin/env bun
/**
 * Setup Supabase Infrastructure
 *
 * Creates required storage buckets and applies migrations
 */

import { createClient } from '@supabase/supabase-js'

async function main() {
  console.log('🚀 Setting up Supabase infrastructure...\n')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SECRET_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local')
    console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
    },
  })

  // Create storage buckets
  console.log('1️⃣ Creating storage buckets...')

  // Create uploads bucket (public for preview images)
  const { data: uploadsData, error: uploadsError } = await supabase.storage.createBucket(
    'uploads',
    {
      public: true,
      fileSizeLimit: 10 * 1024 * 1024, // 10MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    }
  )

  if (uploadsError) {
    if (uploadsError.message.includes('already exists')) {
      console.log('✅ Bucket "uploads" already exists')
    } else {
      console.error(`❌ Failed to create uploads bucket: ${uploadsError.message}`)
    }
  } else {
    console.log('✅ Created "uploads" bucket')
  }

  // Create stickers bucket (public)
  const { data: stickersData, error: stickersError } = await supabase.storage.createBucket(
    'stickers',
    {
      public: true,
      fileSizeLimit: 500 * 1024, // 500KB per sticker
      allowedMimeTypes: ['image/png'],
    }
  )

  if (stickersError) {
    if (stickersError.message.includes('already exists')) {
      console.log('✅ Bucket "stickers" already exists')
    } else {
      console.error(`❌ Failed to create stickers bucket: ${stickersError.message}`)
    }
  } else {
    console.log('✅ Created "stickers" bucket')
  }

  console.log('')

  // Set storage policies
  console.log('2️⃣ Configuring storage policies...')
  console.log('ℹ️  Storage policies are managed via RLS in the migration')
  console.log('   Service role (used by API) has full access')
  console.log('')

  // Verify buckets are accessible
  console.log('3️⃣ Verifying bucket access...')

  const { data: buckets, error: listError } = await supabase.storage.listBuckets()

  if (listError) {
    console.error(`❌ Failed to list buckets: ${listError.message}`)
  } else {
    const uploads = buckets?.find(b => b.name === 'uploads')
    const stickers = buckets?.find(b => b.name === 'stickers')

    if (uploads) {
      console.log(`✅ Uploads bucket: ${uploads.public ? 'public' : 'private'}`)
    }
    if (stickers) {
      console.log(`✅ Stickers bucket: ${stickers.public ? 'public' : 'private'}`)
    }
  }

  console.log('')
  console.log('✅ Setup complete!')
  console.log('')
  console.log('Next steps:')
  console.log('1. Run migrations in Supabase dashboard:')
  console.log('   - Go to SQL Editor')
  console.log('   - Run: supabase/migrations/001_initial_schema.sql')
  console.log('')
  console.log('2. Or use Supabase CLI:')
  console.log('   supabase db push')
  console.log('')
  console.log('3. Verify setup:')
  console.log('   bun scripts/verify-setup.ts')
}

main().catch(console.error)
