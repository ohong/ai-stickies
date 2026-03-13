#!/usr/bin/env bun
/**
 * Test AI Provider Configuration
 */

import { featureFlags } from '../src/lib/config'
import { getDefaultProvider, getAvailableProviders } from '../src/lib/ai/provider'
import * as flux from '../src/lib/ai/flux'
import * as fal from '../src/lib/ai/fal'

console.log('🧪 AI Provider Configuration Test\n')

console.log('Feature Flags:')
console.log(`  FLUX enabled: ${featureFlags.enableFlux}`)
console.log(`  Fal enabled: ${featureFlags.enableFal}`)
console.log('')

console.log('Provider Availability:')
console.log(`  FLUX available: ${flux.isFluxAvailable()}`)
console.log(`  Fal available: ${fal.isFalAvailable()}`)
console.log('')

console.log('Available Providers:', getAvailableProviders())
console.log('')

try {
  const defaultProvider = getDefaultProvider()
  console.log(`✅ Default Provider: ${defaultProvider.toUpperCase()}`)

  if (defaultProvider === 'fal') {
    console.log('\n✨ Fal (nano-banana-2) will be used for image generation!')
  } else {
    console.log('\n⚠️  FLUX will be used (Fal not available)')
  }
} catch (error) {
  console.error('❌ No providers available:', error)
}
