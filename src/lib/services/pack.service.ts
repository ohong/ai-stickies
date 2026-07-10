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
import { getSignedUrl } from '../utils/storage'
import { storageConfig, generationConfig } from '../config'
import { refundPackGenerationCharge } from './credits.service'
import type {
  Language,
  FidelityLevel,
  StickerPack,
  Sticker,
  Generation,
} from '../../types/database'

const { batchSize: BATCH_SIZE, maxRetries: MAX_RETRIES } = generationConfig

export interface PackGenerationInput {
  generationId: string
  stylePreviewId: string
  styleName: string
  style: FidelityLevel
  characterPrompt: string
  language: Language
  personalContext?: string
  count?: number
  referenceImageBase64?: string
  referenceImageMimeType?: string
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

export interface GenerationProgressSnapshot {
  status: Generation['status']
  packs: Array<{
    id: string
    styleName: string
    stickersCompleted: number
  }>
  totalStickersPerPack: number
}

interface StickerWithBuffer {
  sticker: Sticker
  buffer: Buffer
}

type ProgressCallback = (progress: PackGenerationProgress) => void

const STALE_PACK_GENERATION_MINUTES = 15

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
  let createdPackId: string | null = null

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
    createdPackId = pack.id

    // Step 3: Generate and process images
    reportProgress({
      status: 'generating_images',
      currentStep: 2,
      message: 'Generating sticker images...',
    })

    const stickersWithBuffers = await generateStickersInBatches(
      pack.id,
      input.generationId,
      prompts,
      supabase,
      input.referenceImageBase64,
      input.referenceImageMimeType,
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

    if (stickersWithBuffers.length === 0) {
      throw new Error('No stickers were generated successfully')
    }

    if (stickersWithBuffers.length < count) {
      throw new Error(`Only ${stickersWithBuffers.length}/${count} stickers were generated`)
    }

    const stickers = stickersWithBuffers.map(s => s.sticker)

    // Build cache of buffers to avoid re-downloading for ZIP
    const cachedBuffers = new Map<string, Buffer>()
    for (const { sticker, buffer } of stickersWithBuffers) {
      cachedBuffers.set(sticker.storage_path, buffer)
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
      supabase,
      cachedBuffers
    )

    // Update pack with ZIP path
    if (zipUrl) {
      await supabase
        .from('sticker_packs')
        .update({ zip_storage_path: zipUrl })
        .eq('id', pack.id)
    }

    reportProgress({
      status: 'completed',
      currentStep: 4,
      message: 'Pack generation complete!',
      completedStickers: stickers.length,
    })

    return {
      pack: { ...pack, zip_storage_path: zipUrl },
      stickers,
      zipUrl: zipUrl
        ? await getSignedUrl(supabase, storageConfig.stickerBucket, zipUrl, 60 * 60)
        : null,
      errors,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    errors.push(message)

    if (createdPackId) {
      await deletePacksWithArtifacts([createdPackId])
    }

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
  referenceImageBase64: string | undefined,
  referenceImageMimeType: string | undefined,
  onProgress: (completed: number) => void,
  errors: string[]
): Promise<StickerWithBuffer[]> {
  const stickers: StickerWithBuffer[] = []
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
          supabase,
          referenceImageBase64,
          referenceImageMimeType
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
  referenceImageBase64?: string,
  referenceImageMimeType?: string,
  retryCount = 0
): Promise<StickerWithBuffer> {
  try {
    // Generate image (with automatic fallback)
    const result = await generateImageWithFallback({
      prompt: prompt.fullPrompt,
      referenceImage: referenceImageBase64,
      referenceImageMimeType,
      maxAttemptsPerModel: 1,
      maxFallbackModels: 2,
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

    return { sticker, buffer: processedBuffer }
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
          referenceImageBase64,
          referenceImageMimeType,
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
  supabase: ReturnType<typeof createAdminClient>,
  cachedBuffers?: Map<string, Buffer>
): Promise<string | null> {
  try {
    // Use cached buffers when available, fall back to downloading
    const stickerData = await Promise.all(
      stickers.map(async sticker => {
        const cached = cachedBuffers?.get(sticker.storage_path)
        let buffer: Buffer

        if (cached) {
          buffer = cached
        } else {
          const { data, error } = await supabase.storage
            .from(storageConfig.stickerBucket)
            .download(sticker.storage_path)

          if (error || !data) {
            throw new Error(`Failed to download sticker: ${sticker.storage_path}`)
          }

          buffer = Buffer.from(await data.arrayBuffer())
        }

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
 * Get generation progress from database
 */
export async function getGenerationProgress(generationId: string): Promise<GenerationProgressSnapshot | null> {
  const supabase = createAdminClient()

  const { data: generation } = await supabase
    .from('generations')
    .select('*, sticker_packs(*, stickers(*))')
    .eq('id', generationId)
    .single()

  if (!generation) {
    return null
  }

  const packs = (generation as Generation & {
    sticker_packs: Array<StickerPack & { stickers: Sticker[] }>
  }).sticker_packs ?? []

  return {
    status: generation.status,
    packs: packs.map((pack) => ({
      id: pack.id,
      styleName: pack.style_name,
      stickersCompleted: pack.stickers?.length ?? 0,
    })),
    totalStickersPerPack: generationConfig.defaultPackSize,
  }
}

export async function deletePacksWithArtifacts(packIds: string[]): Promise<void> {
  if (packIds.length === 0) return

  const supabase = createAdminClient()
  const { data: packs, error: packsError } = await supabase
    .from('sticker_packs')
    .select('id, zip_storage_path, marketplace_zip_path')
    .in('id', packIds)

  if (packsError) {
    throw new Error(`Failed to fetch packs for cleanup: ${packsError.message}`)
  }

  const { data: stickers, error: stickersError } = await supabase
    .from('stickers')
    .select('storage_path')
    .in('pack_id', packIds)

  if (stickersError) {
    throw new Error(`Failed to fetch stickers for cleanup: ${stickersError.message}`)
  }

  const storagePaths = new Set<string>()
  for (const pack of packs ?? []) {
    if (pack.zip_storage_path) storagePaths.add(pack.zip_storage_path)
    if (pack.marketplace_zip_path) storagePaths.add(pack.marketplace_zip_path)
  }
  for (const sticker of stickers ?? []) {
    storagePaths.add(sticker.storage_path)
  }

  const paths = [...storagePaths]
  for (let i = 0; i < paths.length; i += 100) {
    const chunk = paths.slice(i, i + 100)
    const { error } = await supabase.storage
      .from(storageConfig.stickerBucket)
      .remove(chunk)

    if (error) {
      throw new Error(`Failed to remove pack storage artifacts: ${error.message}`)
    }
  }

  const { error: deleteError } = await supabase
    .from('sticker_packs')
    .delete()
    .in('id', packIds)

  if (deleteError) {
    throw new Error(`Failed to delete pack rows: ${deleteError.message}`)
  }
}

export async function reconcileStalePackGeneration(
  generation: Pick<
    Generation,
    | 'id'
    | 'status'
    | 'pack_generation_started_at'
    | 'pack_credit_cost'
  >
): Promise<boolean> {
  if (generation.status !== 'processing' || !generation.pack_generation_started_at) {
    return false
  }

  const startedAt = new Date(generation.pack_generation_started_at).getTime()
  const staleAfterMs = STALE_PACK_GENERATION_MINUTES * 60 * 1000
  if (Number.isNaN(startedAt) || Date.now() - startedAt < staleAfterMs) {
    return false
  }

  const supabase = createAdminClient()
  const { data: packs, error: packsError } = await supabase
    .from('sticker_packs')
    .select('id')
    .eq('generation_id', generation.id)

  if (packsError) {
    throw new Error(`Failed to fetch stale packs: ${packsError.message}`)
  }

  await deletePacksWithArtifacts((packs ?? []).map((pack) => pack.id))
  await refundPackGenerationCharge(generation.id, generation.pack_credit_cost)

  const { error } = await supabase
    .from('generations')
    .update({
      status: 'failed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', generation.id)

  if (error) {
    throw new Error(`Failed to mark stale generation failed: ${error.message}`)
  }

  return true
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
