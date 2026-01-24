#!/usr/bin/env bun
/**
 * Run Database Migrations
 *
 * Applies the initial schema migration to Supabase
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

async function main() {
  console.log('🗄️  Running database migrations...\n')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SECRET_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials')
    process.exit(1)
  }

  // Read migration file
  const migrationPath = join(process.cwd(), 'supabase/migrations/001_initial_schema.sql')
  const sql = readFileSync(migrationPath, 'utf-8')

  console.log('📄 Migration: 001_initial_schema.sql')
  console.log('')

  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  console.log(`📊 Executing ${statements.length} SQL statements...\n`)

  const supabase = createClient(supabaseUrl, supabaseKey)

  // Execute each statement
  let successCount = 0
  let skipCount = 0

  for (const statement of statements) {
    try {
      // Execute raw SQL via RPC
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement })

      if (error) {
        // Check if it's a "already exists" error (safe to skip)
        if (
          error.message.includes('already exists') ||
          error.message.includes('duplicate')
        ) {
          skipCount++
          const firstLine = statement.split('\n')[0].substring(0, 60)
          console.log(`⏭️  Skipped: ${firstLine}...`)
        } else {
          // Try direct query as fallback
          const { error: queryError } = await supabase.from('_migration_test').select()

          // If it's just a missing function, continue
          if (error.message.includes('function') && error.message.includes('does not exist')) {
            console.log('ℹ️  Note: Using Postgres client directly...')

            // For now, we'll skip and recommend manual migration
            console.log('\n⚠️  Cannot execute SQL via API (requires direct Postgres access)')
            console.log('\nPlease run migrations manually:')
            console.log('\n1. Go to your Supabase Dashboard')
            console.log('2. Navigate to SQL Editor')
            console.log('3. Copy and paste: supabase/migrations/001_initial_schema.sql')
            console.log('4. Click "Run"')
            console.log('\nOr install Supabase CLI:')
            console.log('  npm install -g supabase')
            console.log('  supabase link')
            console.log('  supabase db push')
            process.exit(0)
          }

          console.error(`❌ Error: ${error.message}`)
        }
      } else {
        successCount++
        const firstLine = statement.split('\n')[0].substring(0, 60)
        console.log(`✅ ${firstLine}...`)
      }
    } catch (err) {
      console.error(`❌ Failed to execute statement`)
    }
  }

  console.log('')
  console.log(`✅ ${successCount} statements executed`)
  if (skipCount > 0) {
    console.log(`⏭️  ${skipCount} statements skipped (already exist)`)
  }
  console.log('')
  console.log('Run verification:')
  console.log('  bun scripts/verify-setup.ts')
}

main().catch(console.error)
