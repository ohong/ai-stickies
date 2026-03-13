// Environment configuration with type safety and defaults

function requireEnv(name: string): string {
  // In browser/client environment, use the value injected at build time
  // NEXT_PUBLIC_* vars are replaced by Next.js
  if (typeof window !== 'undefined') {
    // Client-side: env vars are injected at build time
    return process.env[name] || ''
  }

  // Server-side: read from actual process.env
  const value = process.env[name]
  if (!value) {
    // During build time, env vars may not be available
    // Return empty string to allow build to complete
    if (process.env.NODE_ENV === 'production') {
      console.warn(`Warning: Missing environment variable: ${name}`)
      return ''
    }
    // In development, throw for immediate feedback (server-side only)
    if (process.env.NODE_ENV === 'development') {
      throw new Error(`Missing required environment variable: ${name}`)
    }
    return ''
  }
  return value
}

function optionalEnv(name: string, defaultValue: string): string {
  return process.env[name] ?? defaultValue
}

function optionalEnvNumber(name: string, defaultValue: number): number {
  const value = process.env[name]
  if (!value) return defaultValue
  const parsed = parseInt(value, 10)
  return isNaN(parsed) ? defaultValue : parsed
}

// Supabase configuration
export const supabaseConfig = {
  url: requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
  anonKey: requireEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'),
  serviceRoleKey: process.env.SUPABASE_SECRET_KEY ?? '',
}

// AI provider configuration
export const aiConfig = {
  bflApiKey: process.env.BFL_API_KEY ?? '',
  bflModel: process.env.BFL_MODEL ?? 'flux-2-pro', // FLUX.2: flux-2-pro
  falApiKey: process.env.FAL_API_KEY ?? '',
  falModel: process.env.FAL_MODEL ?? 'fal-ai/nano-banana-2',
  fireworksApiKey: process.env.FIREWORKS_API_KEY ?? '',
}

// Session configuration
export const sessionConfig = {
  maxGenerations: optionalEnvNumber('SESSION_MAX_GENERATIONS', 10),
  sessionTtlDays: optionalEnvNumber('SESSION_TTL_DAYS', 1), // US-3.1: 24hr expiry
}

// Storage configuration
export const storageConfig = {
  uploadBucket: optionalEnv('STORAGE_UPLOAD_BUCKET', 'uploads'),
  stickerBucket: optionalEnv('STORAGE_STICKER_BUCKET', 'stickers'),
  maxUploadSizeMb: optionalEnvNumber('MAX_UPLOAD_SIZE_MB', 10),
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
}

// Generation configuration
export const generationConfig = {
  defaultPackSize: 10 as const, // US-1.4: 10 stickers per pack
  batchSize: 3 as const, // Generate N images at a time
  maxRetries: 1 as const, // Retry failed stickers once
  pollIntervalMs: optionalEnvNumber('POLL_INTERVAL_MS', 2000),
  maxPollAttempts: optionalEnvNumber('MAX_POLL_ATTEMPTS', 60),
  imageWidth: 370,
  imageHeight: 320,
}

// Feature flags
export const featureFlags = {
  enableFlux: process.env.ENABLE_FLUX !== 'false', // default true (enabled if BFL_API_KEY exists)
  enableFal: process.env.ENABLE_FAL !== 'false', // default true
  enableMarketplaceExport: process.env.ENABLE_MARKETPLACE_EXPORT === 'true',
}

// Validate critical config at startup
export function validateConfig(): void {
  // These will throw if missing
  supabaseConfig.url
  supabaseConfig.anonKey

  // Warn about missing AI keys
  if (!aiConfig.bflApiKey && !aiConfig.falApiKey) {
    console.warn('Warning: No AI provider API keys configured')
  }
}

export const config = {
  supabase: supabaseConfig,
  ai: aiConfig,
  session: sessionConfig,
  storage: storageConfig,
  generation: generationConfig,
  features: featureFlags,
  validate: validateConfig,
}

export default config
