#!/usr/bin/env bun
/**
 * Test BFL API / FLUX.2
 */

import * as flux from '../src/lib/ai/flux'

async function main() {
  console.log('🧪 Testing BFL API (FLUX.2)...\n')

  // Check if API key is available
  if (!flux.isFluxAvailable()) {
    console.error('❌ BFL_API_KEY not set in .env.local')
    process.exit(1)
  }

  console.log('✅ BFL_API_KEY is configured')
  console.log('')

  try {
    console.log('📤 Sending test generation request...')
    console.log('   Prompt: "cute kawaii cat sticker, simple, white background"')
    console.log('')

    const result = await flux.generateImage({
      prompt: 'cute kawaii cat sticker, simple, white background',
      width: 370,
      height: 320,
    })

    console.log('✅ Generation successful!')
    console.log(`   Image URL: ${result.imageUrl}`)
    console.log(`   Task ID: ${result.id}`)
    console.log('')
    console.log('🎉 BFL API is working correctly!')
    console.log('')
    console.log('View generated image:')
    console.log(result.imageUrl)
  } catch (error) {
    console.error('❌ BFL API test failed:')

    if (error instanceof flux.FluxError) {
      console.error(`   Error Code: ${error.code}`)
      console.error(`   Message: ${error.message}`)

      if (error.code === 'UNAUTHORIZED') {
        console.error('')
        console.error('   Your BFL_API_KEY may be invalid.')
        console.error('   Get a new key at: https://api.bfl.ai/')
      } else if (error.code === 'QUOTA_EXCEEDED') {
        console.error('')
        console.error('   You have exceeded your BFL API quota.')
        console.error('   Add credits at: https://api.bfl.ai/')
      }
    } else {
      console.error(`   ${error}`)
    }

    process.exit(1)
  }
}

main()
