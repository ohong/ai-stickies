#!/usr/bin/env bun
/**
 * Test AI Provider Configuration
 */

import { featureFlags } from '../src/lib/config'
import { getDefaultProvider, getAvailableProviders } from '../src/lib/ai/provider'
import * as flux from '../src/lib/ai/flux'
import * as gemini from '../src/lib/ai/gemini'

console.log('🧪 AI Provider Configuration Test\n')

console.log('Feature Flags:')
console.log(`  FLUX enabled: ${featureFlags.enableFlux}`)
console.log(`  Gemini enabled: ${featureFlags.enableGemini}`)
console.log('')

console.log('Provider Availability:')
console.log(`  FLUX available: ${flux.isFluxAvailable()}`)
console.log(`  Gemini available: ${gemini.isGeminiAvailable()}`)
console.log('')

console.log('Available Providers:', getAvailableProviders())
console.log('')

try {
  const defaultProvider = getDefaultProvider()
  console.log(`✅ Default Provider: ${defaultProvider.toUpperCase()}`)

  if (defaultProvider === 'flux') {
    console.log('\n✨ FLUX.2 will be used for image generation!')
  } else {
    console.log('\n⚠️  Gemini will be used (FLUX not available)')
  }
} catch (error) {
  console.error('❌ No providers available:', error)
}
