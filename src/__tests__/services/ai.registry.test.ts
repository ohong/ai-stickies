import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const ORIGINAL_ENV = { ...process.env }

async function loadRegistry() {
  vi.resetModules()
  return await import('@/src/lib/ai/registry')
}

describe('AI model registry', () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV }
    delete process.env.IMAGE_MODEL
    delete process.env.FAL_API_KEY
    delete process.env.BFL_API_KEY
    delete process.env.OPENAI_API_KEY
  })

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV }
  })

  it('uses registry order as the default fallback order', async () => {
    process.env.FAL_API_KEY = 'fal-key'
    process.env.BFL_API_KEY = 'bfl-key'

    const { getAvailableModels, getDefaultModel } = await loadRegistry()

    expect(getAvailableModels().map((model) => model.id)).toEqual([
      'nano-banana-2',
      'nano-banana-pro',
      'flux-2-pro',
    ])
    expect(getDefaultModel().id).toBe('nano-banana-2')
  })

  it('respects IMAGE_MODEL when the selected model is available', async () => {
    process.env.OPENAI_API_KEY = 'openai-key'
    process.env.IMAGE_MODEL = 'gpt-image'

    const { getDefaultModel } = await loadRegistry()

    expect(getDefaultModel().id).toBe('gpt-image')
  })

  it('throws with the unknown model id when IMAGE_MODEL is invalid', async () => {
    process.env.FAL_API_KEY = 'fal-key'
    process.env.IMAGE_MODEL = 'not-a-real-model'

    const { getDefaultModel } = await loadRegistry()

    expect(() => getDefaultModel()).toThrow('not-a-real-model')
  })

  it('throws when the configured model does not have its required key', async () => {
    process.env.IMAGE_MODEL = 'gpt-image'

    const { getDefaultModel } = await loadRegistry()

    expect(() => getDefaultModel()).toThrow('gpt-image')
  })
})
