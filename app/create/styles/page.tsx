'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  StylePreviewCard,
  SelectionSummary,
  GenerationProgress,
  StylePreviewGridSkeleton,
} from '@/src/components/styles'
import { SessionCounter } from '@/app/components/create'
import { useSession } from '@/src/hooks/use-session'
import { useStyleSelection } from '@/src/hooks/use-style-selection'
import type { GeneratedPreview } from '@/src/hooks/use-generation'

interface GenerationData {
  generation: {
    id: string
    status: string
  }
  previews: GeneratedPreview[]
}

function StylesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const generationId = searchParams.get('generationId')

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [generationData, setGenerationData] = useState<GenerationData | null>(null)
  const [isGeneratingPacks, setIsGeneratingPacks] = useState(false)

  const {
    remainingGenerations,
    maxGenerations,
    isLoading: sessionLoading,
  } = useSession()

  const {
    selectedStyleIds,
    selectedCount,
    estimatedTime,
    canProceed,
    toggleStyle,
    isSelected,
  } = useStyleSelection()

  useEffect(() => {
    if (!generationId) {
      setError('No generation ID provided')
      setIsLoading(false)
      return
    }

    async function fetchGeneration() {
      try {
        const response = await fetch(`/api/generations/${generationId}`)
        if (!response.ok) {
          throw new Error('Failed to load generation')
        }
        const data = await response.json()
        setGenerationData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load')
      } finally {
        setIsLoading(false)
      }
    }

    fetchGeneration()
  }, [generationId])

  const handleGeneratePacks = async () => {
    if (!canProceed || !generationId) return

    setIsGeneratingPacks(true)

    try {
      const response = await fetch('/api/generate/packs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generationId,
          selectedStyleIds,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to start pack generation')
      }

      router.push(`/create/results?generationId=${generationId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
      setIsGeneratingPacks(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-background">
        <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center gap-2">
                <div className="size-7 rounded-lg bg-primary flex items-center justify-center">
                  <svg className="size-4 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="font-bold text-foreground">AI Stickies</span>
              </Link>
              <SessionCounter remaining={remainingGenerations} total={maxGenerations} isLoading={sessionLoading} />
            </div>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3 text-balance">
              Loading Previews...
            </h1>
          </div>
          <StylePreviewGridSkeleton />
        </main>
      </div>
    )
  }

  if (error || !generationData) {
    return (
      <div className="min-h-dvh bg-background flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="size-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-destructive">!</span>
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            {error || 'Generation not found'}
          </h2>
          <p className="text-muted-foreground mb-6">
            The generation may have expired or there was an error loading it.
          </p>
          <Button onClick={() => router.push('/create')}>
            <ArrowLeft className="size-4 mr-2" />
            Back to Create
          </Button>
        </div>
      </div>
    )
  }

  if (isGeneratingPacks) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <GenerationProgress
          progress={30}
          currentStyle="Generating sticker packs"
          totalStyles={selectedCount}
        />
      </div>
    )
  }

  const { previews } = generationData

  return (
    <div className="min-h-dvh bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="size-7 rounded-lg bg-primary flex items-center justify-center">
                <svg className="size-4 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="font-bold text-foreground">AI Stickies</span>
            </Link>
            <SessionCounter remaining={remainingGenerations} total={maxGenerations} isLoading={sessionLoading} />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <div className="text-center mb-8">
          <span className="text-primary font-medium text-sm uppercase tracking-widest">Step 2</span>
          <h1 className="mt-2 text-3xl md:text-4xl font-bold text-foreground mb-3 text-balance">
            Select Your Styles
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-pretty">
            Choose 1-5 styles to generate full sticker packs. Each pack will contain 8 unique stickers.
          </p>
        </div>

        <div className="mb-8">
          <SelectionSummary selectedCount={selectedCount} estimatedTime={estimatedTime} maxSelection={5} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
          {previews.map((preview) => (
            <StylePreviewCard
              key={preview.id}
              id={preview.id}
              styleName={preview.styleName}
              description={preview.description}
              previewUrl={preview.previewUrl}
              isSelected={isSelected(preview.id)}
              onToggle={toggleStyle}
            />
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button variant="outline" size="lg" onClick={() => router.push('/create')} className="w-full sm:w-auto">
            <ArrowLeft className="size-4 mr-2" />
            Back
          </Button>

          <Button
            size="lg"
            onClick={handleGeneratePacks}
            disabled={!canProceed}
            className="w-full sm:w-auto min-w-[200px] shadow-md"
          >
            <Sparkles className="size-4 mr-2" />
            Generate {selectedCount > 0 ? selectedCount : ''} Pack{selectedCount !== 1 ? 's' : ''}
            <ArrowRight className="size-4 ml-2" />
          </Button>
        </div>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Each pack uses 1 generation. You have {remainingGenerations} remaining.
        </p>
      </main>
    </div>
  )
}

export default function StylesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <GenerationProgress progress={10} currentStyle="Loading..." totalStyles={5} />
      </div>
    }>
      <StylesContent />
    </Suspense>
  )
}
