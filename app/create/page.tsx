'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, ArrowLeft, AlertCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ImageUploader } from '@/app/components/create/image-uploader'
import { ImagePreview } from '@/app/components/create/image-preview'
import { StyleInput } from '@/app/components/create/style-input'
import { ContextInput } from '@/app/components/create/context-input'
import { LanguageSelect } from '@/app/components/create/language-select'
import { SessionCounter } from '@/app/components/create/session-counter'
import { GenerationProgress } from '@/src/components/styles/generation-progress'
import { useUpload } from '@/src/hooks/use-upload'
import { useSession } from '@/src/hooks/use-session'
import { useGeneration } from '@/src/hooks/use-generation'
import { DEFAULT_LANGUAGE } from '@/src/constants/languages'
import type { Language } from '@/src/types'

export default function CreatePage() {
  const router = useRouter()
  const [styleDescription, setStyleDescription] = useState('')
  const [personalContext, setPersonalContext] = useState('')
  const [language, setLanguage] = useState<Language>(DEFAULT_LANGUAGE)

  const {
    uploadedImage,
    uploadProgress,
    isUploading,
    error: uploadError,
    uploadFile,
    clearUpload,
    clearError,
  } = useUpload()

  const {
    remainingGenerations,
    maxGenerations,
    isLoading: sessionLoading,
    error: sessionError,
    canGenerate,
    decrementGenerations,
  } = useSession()

  const {
    isGenerating,
    progress: generationProgress,
    currentStyle,
    error: generationError,
    generatePreviews,
    clearError: clearGenerationError,
  } = useGeneration()

  const handleGenerate = async () => {
    if (!uploadedImage || !canGenerate) return

    const result = await generatePreviews(uploadedImage.id, {
      styleDescription,
      personalContext,
      language,
    })

    if (result) {
      decrementGenerations()
      router.push(`/create/styles?generationId=${result.generationId}`)
    }
  }

  const isGenerateDisabled =
    !uploadedImage || isUploading || sessionLoading || !canGenerate || isGenerating

  const displayError = uploadError || generationError || sessionError

  const handleClearError = () => {
    clearError()
    clearGenerationError()
  }

  return (
    <div className="min-h-dvh bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="size-4" />
              <span className="text-sm">Back</span>
            </Link>
            <Link href="/" className="flex items-center gap-2">
              <div className="size-7 rounded-lg bg-primary flex items-center justify-center">
                <svg
                  className="size-4 text-primary-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <span className="font-bold text-foreground">AI Stickies</span>
            </Link>
            <SessionCounter />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-3xl mx-auto px-3 sm:px-6 lg:px-8 pt-18 sm:pt-22 pb-8 sm:pb-12">
        {/* Page title */}
        <div className="text-center mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground text-balance">
            Create Your Sticker Pack
          </h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-muted-foreground text-pretty">
            Upload a photo, then customize your style
          </p>
        </div>

        {/* Generating overlay */}
        {isGenerating && (
          <div className="mb-8">
            <GenerationProgress
              progress={generationProgress}
              currentStyle={currentStyle}
              totalStyles={5}
            />
          </div>
        )}

        {/* Single-column stacked layout */}
        <div className="space-y-6">
          {/* Section 1: Photo upload */}
          <section>
            <h2 className="text-sm font-medium text-foreground mb-3">
              Your Photo
            </h2>
            {uploadedImage ? (
              <ImagePreview
                imageUrl={uploadedImage.url}
                filename={uploadedImage.filename}
                size={uploadedImage.size}
                onRemove={clearUpload}
              />
            ) : (
              <ImageUploader
                onUpload={uploadFile}
                isUploading={isUploading}
                uploadProgress={uploadProgress}
                disabled={!canGenerate || isGenerating}
              />
            )}
            {/* Upload error shown inline */}
            {uploadError && (
              <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm flex items-start gap-2">
                <AlertCircle className="size-4 mt-0.5 shrink-0" />
                <span className="flex-1">{uploadError}</span>
                <button onClick={clearError} aria-label="Dismiss error">
                  <X className="size-4" />
                </button>
              </div>
            )}
            {!canGenerate && !sessionLoading && !sessionError && (
              <p className="mt-3 text-sm text-amber-700 bg-amber-50 rounded-lg p-3 text-center">
                You&apos;ve used all your free generations. Check back later.
              </p>
            )}
          </section>

          {/* Section 2: Customization — only show after upload */}
          {uploadedImage && (
            <section className="space-y-5">
              <h2 className="text-sm font-medium text-foreground">
                Customize
                <span className="text-muted-foreground font-normal ml-1">(optional)</span>
              </h2>
              <div className="bg-card rounded-2xl border border-border p-5 space-y-5">
                <StyleInput
                  value={styleDescription}
                  onChange={setStyleDescription}
                  disabled={isGenerating}
                />
                <ContextInput
                  value={personalContext}
                  onChange={setPersonalContext}
                  disabled={isGenerating}
                />
                <LanguageSelect
                  value={language}
                  onChange={setLanguage}
                  disabled={isGenerating}
                />
              </div>
            </section>
          )}

          {/* Generation / session error shown near the action */}
          {(generationError || sessionError) && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm flex items-start gap-2">
              <AlertCircle className="size-4 mt-0.5 shrink-0" />
              <span className="flex-1">{generationError || sessionError}</span>
              <button onClick={handleClearError} aria-label="Dismiss error">
                <X className="size-4" />
              </button>
            </div>
          )}

          {/* Generate button — right below the form */}
          {uploadedImage && (
            <div className="flex flex-col items-center pt-2">
              <Button
                size="lg"
                onClick={handleGenerate}
                disabled={isGenerateDisabled}
                className="w-full sm:w-auto min-w-[280px] h-13 text-base font-semibold"
              >
                Generate 5 Style Previews
                <ArrowRight className="size-5 ml-1" />
              </Button>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Uses 1 of your {maxGenerations} free generations
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
