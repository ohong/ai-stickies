import { aiConfig, featureFlags } from '@/src/lib/config'

export type AdapterId = 'fal' | 'bfl' | 'openai'
export type ModelEnvKey = 'FAL_API_KEY' | 'BFL_API_KEY' | 'OPENAI_API_KEY'

export interface ModelEntry {
  id: string
  adapter: AdapterId
  remoteModel: string
  supportsReferenceImage: boolean
  envKey: ModelEnvKey
}

export const MODELS: ModelEntry[] = [
  {
    id: 'nano-banana-2',
    adapter: 'fal',
    remoteModel: 'fal-ai/nano-banana-2',
    supportsReferenceImage: true,
    envKey: 'FAL_API_KEY',
  },
  {
    id: 'nano-banana-pro',
    adapter: 'fal',
    remoteModel: 'fal-ai/nano-banana-pro',
    supportsReferenceImage: true,
    envKey: 'FAL_API_KEY',
  },
  {
    id: 'flux-2-pro',
    adapter: 'bfl',
    remoteModel: 'flux-2-pro',
    supportsReferenceImage: true,
    envKey: 'BFL_API_KEY',
  },
  {
    id: 'gpt-image',
    adapter: 'openai',
    remoteModel: 'gpt-image-1',
    supportsReferenceImage: true,
    envKey: 'OPENAI_API_KEY',
  },
]

export function getModel(id: string): ModelEntry {
  const model = MODELS.find((entry) => entry.id === id)
  if (!model) {
    throw new Error(`Unknown image model: ${id}`)
  }
  return model
}

export function isModelAvailable(entry: ModelEntry): boolean {
  if (entry.adapter === 'fal' && !featureFlags.enableFal) return false
  if (entry.adapter === 'bfl' && !featureFlags.enableFlux) return false
  return Boolean(getEnvValue(entry.envKey))
}

export function getAvailableModels(): ModelEntry[] {
  return MODELS.filter(isModelAvailable)
}

export function getDefaultModel(): ModelEntry {
  if (aiConfig.imageModel) {
    const configured = getModel(aiConfig.imageModel)
    if (!isModelAvailable(configured)) {
      throw new Error(`Configured image model is unavailable: ${aiConfig.imageModel}`)
    }
    return configured
  }

  const available = getAvailableModels()
  if (available.length === 0) {
    throw new Error('No image model available. Configure FAL_API_KEY, BFL_API_KEY, or OPENAI_API_KEY.')
  }

  return available[0]
}

function getEnvValue(key: ModelEnvKey): string {
  switch (key) {
    case 'FAL_API_KEY':
      return aiConfig.falApiKey
    case 'BFL_API_KEY':
      return aiConfig.bflApiKey
    case 'OPENAI_API_KEY':
      return aiConfig.openaiApiKey
  }
}
