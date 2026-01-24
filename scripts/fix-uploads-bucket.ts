#!/usr/bin/env bun
/**
 * Fix Uploads Bucket - Make it Public
 *
 * The uploads bucket needs to be public so preview images can load
 */

import { createClient } from '@supabase/supabase-js'

async function main() {
  console.log('🔧 Fixing uploads bucket visibility...\n')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SECRET_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // Update bucket to be public
  const { data, error } = await supabase.storage.updateBucket('uploads', {
    public: true,
  })

  if (error) {
    console.error(`❌ Failed to update bucket: ${error.message}`)
    console.log('\nManual fix:')
    console.log('1. Go to Supabase Dashboard → Storage → uploads')
    console.log('2. Click "Edit bucket"')
    console.log('3. Toggle "Public bucket" to ON')
    console.log('4. Save')
    process.exit(1)
  }

  console.log('✅ Uploads bucket is now public')
  console.log('\nPreview images should now load correctly!')
}

main().catch(console.error)
