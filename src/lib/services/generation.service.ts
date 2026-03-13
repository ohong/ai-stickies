/**
 * Generation service for creating style previews
 * Orchestrates AI generation and storage
 */

import { createAdminClient } from '@/src/lib/supabase/admin'
import { generateImageWithFallback, resultToBase64 } from '@/src/lib/ai/provider'
import { generateSimplePreviewPrompt } from '@/src/lib/services/prompt.service'
import { processForLine } from '@/src/lib/services/image-processing.service'
import { STYLE_ORDER, getStyleConfig } from '@/src/constants/styles'
import { storageConfig, generationConfig } from '@/src/lib/config'
import type { FidelityLevel, Language, Provider, StylePreview } from '@/src/types/database'

export interface GeneratePreviewsInput {
  sessionId: string
  uploadId: string
  storagePath: string
  styleDescription?: string
  personalContext?: string
  language: Language
  provider?: Provider
}

export interface GeneratedPreview {
  id: string
  styleName: string
  fidelityLevel: FidelityLevel
  description: string
  previewUrl: string
}

export interface GeneratePreviewsResult {
  generationId: string
  previews: GeneratedPreview[]
}

/**
 * Generate style previews for all 5 styles
 */
export async function generateStylePreviews(
  input: GeneratePreviewsInput
): Promise<GeneratePreviewsResult> {
  const supabase = createAdminClient()

  // Create generation record
  const { data: generation, error: genError } = await supabase
    .from('generations')
    .insert({
      session_id: input.sessionId,
      upload_id: input.uploadId,
      style_description: input.styleDescription ?? null,
      personal_context: input.personalContext ?? null,
      language: input.language,
      status: 'processing',
      provider: input.provider ?? null,
    })
    .select()
    .single()

  if (genError || !generation) {
    throw new Error(`Failed to create generation: ${genError?.message ?? 'Unknown error'}`)
  }

  const generationId = generation.id

  try {
    // Get reference image from storage
    const { data: imageData, error: downloadError } = await supabase.storage
      .from(storageConfig.uploadBucket)
      .download(input.storagePath)

    if (downloadError || !imageData) {
      throw new Error(`Failed to download reference image: ${downloadError?.message}`)
    }

    // Convert to base64 for AI providers
    const arrayBuffer = await imageData.arrayBuffer()
    const referenceImageBase64 = Buffer.from(arrayBuffer).toString('base64')
    const mimeType = imageData.type || 'image/png'

    // Generate previews for all styles in parallel
    const previewPromises = STYLE_ORDER.map(async (fidelityLevel) => {
      return generateSinglePreview({
        generationId,
        sessionId: input.sessionId,
        fidelityLevel,
        referenceImageBase64,
        mimeType,
        styleDescription: input.styleDescription,
        personalContext: input.personalContext,
        provider: input.provider,
      })
    })

    const results = await Promise.allSettled(previewPromises)

    // Collect successful previews
    const previews: GeneratedPreview[] = []
    const errors: string[] = []

    for (const result of results) {
      if (result.status === 'fulfilled') {
        previews.push(result.value)
      } else {
        errors.push(result.reason?.message ?? 'Unknown error')
      }
    }

    // Update generation status
    const finalStatus = previews.length > 0 ? 'completed' : 'failed'
    await supabase
      .from('generations')
      .update({
        status: finalStatus,
        completed_at: new Date().toISOString(),
      })
      .eq('id', generationId)

    if (previews.length === 0) {
      throw new Error(`All preview generations failed: ${errors.join(', ')}`)
    }

    return {
      generationId,
      previews,
    }
  } catch (error) {
    // Mark generation as failed
    await supabase
      .from('generations')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', generationId)

    throw error
  }
}

interface SinglePreviewInput {
  generationId: string
  sessionId: string
  fidelityLevel: FidelityLevel
  referenceImageBase64: string
  mimeType: string
  styleDescription?: string
  personalContext?: string
  provider?: Provider
}

/**
 * Generate a single style preview
 */
async function generateSinglePreview(
  input: SinglePreviewInput
): Promise<GeneratedPreview> {
  const supabase = createAdminClient()
  const styleConfig = getStyleConfig(input.fidelityLevel)

  // Build prompt for this style
  const prompt = generateSimplePreviewPrompt({
    style: input.fidelityLevel,
    photoDescription: input.styleDescription ?? 'person in photo',
    personalContext: input.personalContext,
  })

  // Generate image with AI provider (with automatic fallback)
  const result = await generateImageWithFallback({
    prompt,
    referenceImage: input.referenceImageBase64,
    referenceImageMimeType: input.mimeType,
    provider: input.provider as 'flux' | 'fal' | undefined,
    width: generationConfig.imageWidth,
    height: generationConfig.imageHeight,
  })

  // Convert result to base64, then process for LINE specs (resize + compress to fit bucket limit)
  const { data: imageBase64 } = await resultToBase64(result)
  const rawBuffer = Buffer.from(imageBase64, 'base64')
  const processedBuffer = await processForLine(rawBuffer)

  // Upload to storage
  const timestamp = Date.now()
  const storagePath = `${input.sessionId}/previews/${input.generationId}/${input.fidelityLevel}_${timestamp}.png`

  const { error: uploadError } = await supabase.storage
    .from(storageConfig.stickerBucket)
    .upload(storagePath, processedBuffer, {
      contentType: 'image/png',
      upsert: false,
    })

  if (uploadError) {
    throw new Error(`Failed to upload preview: ${uploadError.message}`)
  }

  // Create style_preview record
  const { data: preview, error: dbError } = await supabase
    .from('style_previews')
    .insert({
      generation_id: input.generationId,
      style_name: styleConfig.name,
      fidelity_level: input.fidelityLevel,
      preview_storage_path: storagePath,
      description: styleConfig.description,
    })
    .select()
    .single()

  if (dbError || !preview) {
    throw new Error(`Failed to save preview record: ${dbError?.message}`)
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(storageConfig.stickerBucket)
    .getPublicUrl(storagePath)

  return {
    id: preview.id,
    styleName: styleConfig.name,
    fidelityLevel: input.fidelityLevel,
    description: styleConfig.description,
    previewUrl: urlData.publicUrl,
  }
}

/**
 * Get previews for a generation
 */
export async function getGenerationPreviews(
  generationId: string
): Promise<GeneratedPreview[]> {
  const supabase = createAdminClient()

  const { data: previews, error } = await supabase
    .from('style_previews')
    .select('*')
    .eq('generation_id', generationId)

  if (error) {
    throw new Error(`Failed to fetch previews: ${error.message}`)
  }

  return (previews ?? []).map((preview: StylePreview) => {
    const { data: urlData } = supabase.storage
      .from(storageConfig.stickerBucket)
      .getPublicUrl(preview.preview_storage_path)

    return {
      id: preview.id,
      styleName: preview.style_name,
      fidelityLevel: preview.fidelity_level,
      description: preview.description ?? '',
      previewUrl: urlData.publicUrl,
    }
  })
}

/**
 * Get generation with its previews
 */
export async function getGenerationWithPreviews(generationId: string) {
  const supabase = createAdminClient()

  const { data: generation, error: genError } = await supabase
    .from('generations')
    .select('*')
    .eq('id', generationId)
    .single()

  if (genError || !generation) {
    return null
  }

  const previews = await getGenerationPreviews(generationId)

  return {
    generation,
    previews,
  }
}
