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

export function getAppUrl(): string {
  const fallback = process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000'
    : 'https://ai-stickies.app'
  return optionalEnv('NEXT_PUBLIC_APP_URL', fallback).replace(/\/$/, '')
}

export const appConfig = {
  url: getAppUrl(),
}

// Supabase configuration
export const supabaseConfig = {
  url: requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
  anonKey: requireEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'),
  serviceRoleKey: process.env.SUPABASE_SECRET_KEY ?? '',
}

// AI provider configuration
export const aiConfig = {
  runwayApiKey: process.env.RUNWAY_API_KEY ?? process.env.RUNWAYML_API_SECRET ?? '',
  runwayRouterId: process.env.RUNWAY_IMAGE_ROUTER_ID ?? '',
  runwayRouterSlug: process.env.RUNWAY_IMAGE_ROUTER_SLUG ?? '',
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
  batchSize: 5 as const, // Generate N images at a time
  pollIntervalMs: optionalEnvNumber('POLL_INTERVAL_MS', 2000),
  maxPollAttempts: optionalEnvNumber('MAX_POLL_ATTEMPTS', 60),
  packUseReferenceImage: process.env.PACK_USE_REFERENCE_IMAGE !== 'false',
  imageWidth: 370,
  imageHeight: 320,
}

// Stripe configuration
export const stripeConfig = {
  secretKey: process.env.STRIPE_SECRET_KEY ?? '',
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? '',
}

// Feature flags
export const featureFlags = {
  enableMarketplaceExport: process.env.ENABLE_MARKETPLACE_EXPORT === 'true',
}

// Validate critical config at startup
export function validateConfig(): void {
  if (!supabaseConfig.url) {
    throw new Error('Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL')
  }
  if (!supabaseConfig.anonKey) {
    throw new Error('Missing required environment variable: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')
  }

  // Warn about missing AI keys
  if (!aiConfig.runwayApiKey) {
    console.warn('Warning: No AI provider API keys configured')
  }
}

export const config = {
  app: appConfig,
  supabase: supabaseConfig,
  ai: aiConfig,
  session: sessionConfig,
  storage: storageConfig,
  generation: generationConfig,
  stripe: stripeConfig,
  features: featureFlags,
  validate: validateConfig,
}

export default config
