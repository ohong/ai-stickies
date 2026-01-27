'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, ArrowLeft } from 'lucide-react'
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

  const displayError = uploadError || generationError

  const handleClearError = () => {
    clearError()
    clearGenerationError()
  }

  if (isGenerating) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <GenerationProgress
          progress={generationProgress}
          currentStyle={currentStyle}
          totalStyles={5}
        />
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
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
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        {/* Page title */}
        <div className="text-center mb-10">
          <span className="text-primary font-medium text-sm uppercase tracking-widest">
            Step 1
          </span>
          <h1 className="mt-2 text-3xl md:text-4xl font-bold text-foreground text-balance">
            Upload & Customize
          </h1>
          <p className="mt-3 text-muted-foreground max-w-md mx-auto text-pretty">
            Add your photo and personalize your sticker pack
          </p>
        </div>

        {/* Error message */}
        {displayError && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm flex items-center justify-between max-w-2xl mx-auto">
            <span>{displayError}</span>
            <button
              onClick={handleClearError}
              className="text-destructive hover:text-destructive/80 font-medium"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Two-column layout */}
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Left column - Image upload */}
          <div>
            <h2 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
              <span className="size-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center">1</span>
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
                disabled={!canGenerate}
              />
            )}
            {!canGenerate && !sessionLoading && (
              <p className="mt-4 text-sm text-amber-700 bg-amber-50 rounded-lg p-3 text-center">
                You&apos;ve used all your free generations. Check back later.
              </p>
            )}
          </div>

          {/* Right column - Form inputs */}
          <div>
            <h2 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
              <span className="size-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center">2</span>
              Customize
            </h2>
            <div className="space-y-6 bg-card rounded-2xl border border-border p-6">
              <StyleInput
                value={styleDescription}
                onChange={setStyleDescription}
                disabled={!canGenerate}
              />
              <ContextInput
                value={personalContext}
                onChange={setPersonalContext}
                disabled={!canGenerate}
              />
              <LanguageSelect
                value={language}
                onChange={setLanguage}
                disabled={!canGenerate}
              />
            </div>
          </div>
        </div>

        {/* Generate button */}
        <div className="mt-12 flex flex-col items-center">
          <Button
            size="lg"
            onClick={handleGenerate}
            disabled={isGenerateDisabled}
            className="min-w-[280px] h-14 text-lg font-semibold rounded-full shadow-md"
          >
            Generate Previews
            <ArrowRight className="size-5 ml-2" />
          </Button>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Uses 1 of your {maxGenerations} free generations
          </p>
        </div>
      </main>
    </div>
  )
}
