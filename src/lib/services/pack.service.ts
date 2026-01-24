/**
 * Pack generation service
 * Orchestrates prompt generation, image generation, and storage
 */

import { createAdminClient } from '../supabase/admin'
import { generateStickerPackPrompts, type GeneratedStickerPrompt } from './prompt.service'
import { generateImageWithFallback, resultToBase64 } from '../ai/provider'
import {
  processForLine,
  createMainImageComposite,
  createTabImage,
} from './image-processing.service'
import { createPackZip } from '../utils/zip'
import { storageConfig } from '../config'
import type {
  Language,
  FidelityLevel,
  StickerPack,
  Sticker,
  Generation,
} from '../../types/database'

const BATCH_SIZE = 3 // Generate 3 images at a time
const MAX_RETRIES = 1 // Retry failed stickers once

export interface PackGenerationInput {
  generationId: string
  stylePreviewId: string
  styleName: string
  style: FidelityLevel
  characterPrompt: string
  language: Language
  personalContext?: string
  count?: number
}

export interface PackGenerationProgress {
  status: 'pending' | 'generating_prompts' | 'generating_images' | 'processing' | 'completed' | 'failed'
  currentStep: number
  totalSteps: number
  message: string
  completedStickers: number
  totalStickers: number
}

export interface PackGenerationResult {
  pack: StickerPack
  stickers: Sticker[]
  zipUrl: string | null
  errors: string[]
}

type ProgressCallback = (progress: PackGenerationProgress) => void

/**
 * Generate a complete sticker pack
 */
export async function generateStickerPack(
  input: PackGenerationInput,
  onProgress?: ProgressCallback
): Promise<PackGenerationResult> {
  const supabase = createAdminClient()
  const errors: string[] = []
  const count = input.count ?? 10

  const reportProgress = (progress: Partial<PackGenerationProgress>) => {
    onProgress?.({
      status: 'pending',
      currentStep: 0,
      totalSteps: 4,
      message: '',
      completedStickers: 0,
      totalStickers: count,
      ...progress,
    })
  }

  try {
    // Step 1: Generate prompts
    reportProgress({
      status: 'generating_prompts',
      currentStep: 1,
      message: 'Generating sticker prompts...',
    })

    const prompts = await generateStickerPackPrompts({
      style: input.style,
      characterDescription: input.characterPrompt,
      language: input.language,
      personalContext: input.personalContext,
      count,
    })

    // Step 2: Create pack record
    const { data: pack, error: packError } = await supabase
      .from('sticker_packs')
      .insert({
        generation_id: input.generationId,
        style_preview_id: input.stylePreviewId,
        style_name: input.styleName,
      })
      .select()
      .single()

    if (packError || !pack) {
      throw new Error(`Failed to create pack record: ${packError?.message}`)
    }

    // Step 3: Generate and process images
    reportProgress({
      status: 'generating_images',
      currentStep: 2,
      message: 'Generating sticker images...',
    })

    const stickers = await generateStickersInBatches(
      pack.id,
      input.generationId,
      prompts,
      supabase,
      (completed) => {
        reportProgress({
          status: 'generating_images',
          currentStep: 2,
          message: `Generated ${completed}/${count} stickers`,
          completedStickers: completed,
        })
      },
      errors
    )

    if (stickers.length === 0) {
      throw new Error('No stickers were generated successfully')
    }

    // Step 4: Create ZIP and pack images
    reportProgress({
      status: 'processing',
      currentStep: 3,
      message: 'Creating pack archive...',
      completedStickers: stickers.length,
    })

    const zipUrl = await createAndStorePackZip(
      pack.id,
      input.generationId,
      stickers,
      input.styleName,
      supabase
    )

    // Update pack with ZIP path
    if (zipUrl) {
      await supabase
        .from('sticker_packs')
        .update({ zip_storage_path: zipUrl })
        .eq('id', pack.id)
    }

    // Update generation status
    await supabase
      .from('generations')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', input.generationId)

    reportProgress({
      status: 'completed',
      currentStep: 4,
      message: 'Pack generation complete!',
      completedStickers: stickers.length,
    })

    return {
      pack: { ...pack, zip_storage_path: zipUrl },
      stickers,
      zipUrl: zipUrl ? getPublicUrl(supabase, storageConfig.stickerBucket, zipUrl) : null,
      errors,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    errors.push(message)

    // Update generation as failed
    await supabase
      .from('generations')
      .update({ status: 'failed' })
      .eq('id', input.generationId)

    reportProgress({
      status: 'failed',
      currentStep: 0,
      message: `Generation failed: ${message}`,
      completedStickers: 0,
    })

    throw error
  }
}

/**
 * Generate stickers in batches for parallel processing
 */
async function generateStickersInBatches(
  packId: string,
  generationId: string,
  prompts: GeneratedStickerPrompt[],
  supabase: ReturnType<typeof createAdminClient>,
  onProgress: (completed: number) => void,
  errors: string[]
): Promise<Sticker[]> {
  const stickers: Sticker[] = []
  let completed = 0

  // Process in batches
  for (let i = 0; i < prompts.length; i += BATCH_SIZE) {
    const batch = prompts.slice(i, i + BATCH_SIZE)

    const results = await Promise.allSettled(
      batch.map((prompt, batchIndex) =>
        generateSingleSticker(
          packId,
          generationId,
          prompt,
          i + batchIndex + 1, // 1-indexed sequence number
          supabase
        )
      )
    )

    for (const result of results) {
      if (result.status === 'fulfilled') {
        stickers.push(result.value)
      } else {
        const errorMsg = result.reason?.message ?? 'Unknown error'
        console.error('Sticker generation failed:', errorMsg)

        // Track non-critical errors
        if (!errorMsg.includes('CONTENT_MODERATED')) {
          errors.push(`Sticker failed: ${errorMsg}`)
        }
      }
      completed++
      onProgress(completed)
    }
  }

  return stickers
}

/**
 * Generate a single sticker with retry
 */
async function generateSingleSticker(
  packId: string,
  generationId: string,
  prompt: GeneratedStickerPrompt,
  sequenceNumber: number,
  supabase: ReturnType<typeof createAdminClient>,
  retryCount = 0
): Promise<Sticker> {
  try {
    // Generate image (with automatic fallback)
    const result = await generateImageWithFallback({
      prompt: prompt.fullPrompt,
    })

    // Convert to base64 if needed
    const { data: base64Data } = await resultToBase64(result)
    const buffer = Buffer.from(base64Data, 'base64')

    // Process for LINE specs
    const processedBuffer = await processForLine(buffer)

    // Upload to storage
    const storagePath = `${generationId}/${packId}/${String(sequenceNumber).padStart(2, '0')}.png`
    const { error: uploadError } = await supabase.storage
      .from(storageConfig.stickerBucket)
      .upload(storagePath, processedBuffer, {
        contentType: 'image/png',
        upsert: true,
      })

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`)
    }

    // Create sticker record
    const { data: sticker, error: dbError } = await supabase
      .from('stickers')
      .insert({
        pack_id: packId,
        storage_path: storagePath,
        sequence_number: sequenceNumber,
        emotion: prompt.emotion,
        has_text: prompt.hasText,
        text_content: prompt.textContent,
        prompt_used: prompt.fullPrompt,
      })
      .select()
      .single()

    if (dbError || !sticker) {
      // Clean up uploaded file
      await supabase.storage.from(storageConfig.stickerBucket).remove([storagePath])
      throw new Error(`Database insert failed: ${dbError?.message}`)
    }

    return sticker
  } catch (error) {
    // Retry once for non-moderation errors
    if (retryCount < MAX_RETRIES) {
      const isModeration =
        error instanceof Error &&
        (error.message.includes('MODERATED') || error.message.includes('moderated'))

      if (!isModeration) {
        console.warn(`Retrying sticker ${sequenceNumber}...`)
        await sleep(1000) // Brief delay before retry
        return generateSingleSticker(
          packId,
          generationId,
          prompt,
          sequenceNumber,
          supabase,
          retryCount + 1
        )
      }
    }

    throw error
  }
}

/**
 * Create ZIP and upload to storage
 */
async function createAndStorePackZip(
  packId: string,
  generationId: string,
  stickers: Sticker[],
  packName: string,
  supabase: ReturnType<typeof createAdminClient>
): Promise<string | null> {
  try {
    // Fetch all sticker buffers
    const stickerData = await Promise.all(
      stickers.map(async sticker => {
        const { data, error } = await supabase.storage
          .from(storageConfig.stickerBucket)
          .download(sticker.storage_path)

        if (error || !data) {
          throw new Error(`Failed to download sticker: ${sticker.storage_path}`)
        }

        const buffer = Buffer.from(await data.arrayBuffer())

        return {
          sequenceNumber: sticker.sequence_number,
          buffer,
          emotion: sticker.emotion ?? undefined,
          hasText: sticker.has_text,
          textContent: sticker.text_content,
        }
      })
    )

    // Create pack images from first stickers
    const stickerBuffers = stickerData
      .sort((a, b) => a.sequenceNumber - b.sequenceNumber)
      .map(s => s.buffer)

    const [mainImage, tabImage] = await Promise.all([
      createMainImageComposite(stickerBuffers.slice(0, 4)),
      createTabImage(stickerBuffers[0]),
    ])

    // Create ZIP
    const zipBuffer = await createPackZip({
      stickers: stickerData,
      mainImage,
      tabImage,
      packName,
    })

    // Upload ZIP
    const zipPath = `${generationId}/${packId}/${packName.replace(/\s+/g, '_')}.zip`
    const { error: uploadError } = await supabase.storage
      .from(storageConfig.stickerBucket)
      .upload(zipPath, zipBuffer, {
        contentType: 'application/zip',
        upsert: true,
      })

    if (uploadError) {
      console.error('ZIP upload failed:', uploadError)
      return null
    }

    return zipPath
  } catch (error) {
    console.error('Failed to create pack ZIP:', error)
    return null
  }
}

/**
 * Get public URL for storage path
 */
function getPublicUrl(
  supabase: ReturnType<typeof createAdminClient>,
  bucket: string,
  path: string
): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

/**
 * Get generation progress from database
 */
export async function getGenerationProgress(generationId: string): Promise<PackGenerationProgress | null> {
  const supabase = createAdminClient()

  const { data: generation } = await supabase
    .from('generations')
    .select('*, sticker_packs(*, stickers(*))')
    .eq('id', generationId)
    .single()

  if (!generation) {
    return null
  }

  const pack = (generation as Generation & { sticker_packs: (StickerPack & { stickers: Sticker[] })[] }).sticker_packs?.[0]
  const completedStickers = pack?.stickers?.length ?? 0

  return {
    status: generation.status as PackGenerationProgress['status'],
    currentStep: getStepFromStatus(generation.status),
    totalSteps: 4,
    message: getMessageFromStatus(generation.status, completedStickers),
    completedStickers,
    totalStickers: 10, // Default pack size
  }
}

function getStepFromStatus(status: string): number {
  switch (status) {
    case 'pending': return 0
    case 'processing': return 2
    case 'completed': return 4
    case 'failed': return 0
    default: return 0
  }
}

function getMessageFromStatus(status: string, completed: number): string {
  switch (status) {
    case 'pending': return 'Waiting to start...'
    case 'processing': return `Generating stickers (${completed}/10)...`
    case 'completed': return 'Pack generation complete!'
    case 'failed': return 'Generation failed'
    default: return 'Unknown status'
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Generate multiple packs from selected styles
 */
export async function generateMultiplePacks(
  generationId: string,
  selectedStyles: Array<{
    stylePreviewId: string
    styleName: string
    style: FidelityLevel
  }>,
  commonInput: {
    characterPrompt: string
    language: Language
    personalContext?: string
  },
  onProgress?: (styleIndex: number, progress: PackGenerationProgress) => void
): Promise<PackGenerationResult[]> {
  const results: PackGenerationResult[] = []

  for (let i = 0; i < selectedStyles.length; i++) {
    const styleInput = selectedStyles[i]

    const result = await generateStickerPack(
      {
        generationId,
        stylePreviewId: styleInput.stylePreviewId,
        styleName: styleInput.styleName,
        style: styleInput.style,
        ...commonInput,
      },
      (progress) => onProgress?.(i, progress)
    )

    results.push(result)
  }

  return results
}
