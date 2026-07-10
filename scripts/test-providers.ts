#!/usr/bin/env bun

import { getAvailableModels, getDefaultModel, MODELS } from '../src/lib/ai/registry'
import { generateImageWithFallback } from '../src/lib/ai/provider'

console.log('AI image model configuration')
console.log('')
console.log('Registry order:')
for (const model of MODELS) {
  console.log(`  ${model.id} -> ${model.adapter}:${model.remoteModel}`)
}
console.log('')

const availableModels = getAvailableModels()
console.log('Available models:', availableModels.map((model) => model.id))

try {
  console.log('Default model:', getDefaultModel().id)
} catch (error) {
  console.error('No default model:', error)
  process.exit(1)
}

console.log('')
console.log('Generating one smoke-test image per available model...')

let failureCount = 0

for (const model of availableModels) {
  try {
    const result = await generateImageWithFallback({
      model: model.id,
      prompt: 'LINE sticker of a cheerful person waving, transparent background, bold outline',
      maxAttemptsPerModel: 1,
      maxFallbackModels: 1,
    })
    const hasImage = Boolean(result.imageBase64 || result.imageUrl)
    if (hasImage) {
      console.log(`${model.id}: ok`)
    } else {
      failureCount += 1
      console.error(`${model.id}: missing image data`)
    }
  } catch (error) {
    failureCount += 1
    console.error(`${model.id}: failed`)
    console.error(error)
  }
}

if (failureCount > 0) {
  console.error(`Provider smoke test failed for ${failureCount} model(s).`)
  process.exit(1)
}

console.log('All available image providers passed.')
