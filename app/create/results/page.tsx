'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Sparkles, Store, Loader2, History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SessionCounter } from '@/app/components/create/session-counter'
import { useSession } from '@/src/hooks/use-session'
import { useDownload } from '@/src/hooks/use-download'
import { parseApiResponse } from '@/src/lib/utils/http'
import { StickerPackCard, StickerPackCardSkeleton } from '@/src/components/results/sticker-pack-card'
import { StickerModal } from '@/src/components/results/sticker-modal'
import { DownloadAllButton } from '@/src/components/results/download-buttons'
import { MarketplaceExportModal } from '@/src/components/results/marketplace-export-modal'
import { Confetti } from '@/src/components/results/confetti'

interface StickerData {
  id: string
  sequenceNumber: number
  imageUrl: string
  emotion: string | null
  hasText: boolean
  textContent: string | null
}

interface PackData {
  id: string
  styleName: string
  stickers: StickerData[]
  zipUrl: string | null
}

interface ResultsData {
  packs: PackData[]
  remainingGenerations: number
  errors: string[]
}

function ResultsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const generationId = searchParams.get('generationId')

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [resultsData, setResultsData] = useState<ResultsData | null>(null)

  const [selectedSticker, setSelectedSticker] = useState<StickerData | null>(null)
  const [selectedPackStickers, setSelectedPackStickers] = useState<StickerData[]>([])
  const [currentStickerIndex, setCurrentStickerIndex] = useState(0)
  const [isStickerModalOpen, setIsStickerModalOpen] = useState(false)
  const [isMarketplaceModalOpen, setIsMarketplaceModalOpen] = useState(false)

  const {
    remainingGenerations,
    maxGenerations,
    isLoading: sessionLoading,
  } = useSession()

  const {
    isDownloading,
    downloadError,
    currentDownload,
    downloadPack,
    downloadAll,
    downloadSingleSticker,
    downloadMarketplaceZip,
    clearError,
  } = useDownload()

  useEffect(() => {
    if (!generationId) {
      setError('No generation ID provided')
      setIsLoading(false)
      return
    }

    async function fetchResults() {
      try {
        const response = await fetch(`/api/generations/${generationId}/results`)
        const data = await parseApiResponse<ResultsData>(
          response,
          'Failed to load results'
        )
        setResultsData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load')
      } finally {
        setIsLoading(false)
      }
    }

    fetchResults()
  }, [generationId])

  const handleStickerClick = (sticker: StickerData, index: number, packStickers: StickerData[]) => {
    setSelectedSticker(sticker)
    setSelectedPackStickers(packStickers)
    setCurrentStickerIndex(index)
    setIsStickerModalOpen(true)
  }

  const handleStickerNavigate = (index: number) => {
    setCurrentStickerIndex(index)
    setSelectedSticker(selectedPackStickers[index])
  }

  const handleDownloadPack = async (packId: string, packName: string) => {
    await downloadPack(packId, packName)
  }

  const handleDownloadAll = async () => {
    if (generationId) {
      await downloadAll(generationId)
    }
  }

  const handleMarketplaceExport = async () => {
    if (generationId) {
      await downloadMarketplaceZip(generationId)
      setIsMarketplaceModalOpen(false)
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
              <SessionCounter />
            </div>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3 text-balance">
              Loading Your Stickers...
            </h1>
          </div>
          <div className="space-y-6">
            <StickerPackCardSkeleton />
            <StickerPackCardSkeleton />
          </div>
        </main>
      </div>
    )
  }

  if (error || !resultsData) {
    return (
      <div className="min-h-dvh bg-background flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="size-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-destructive">!</span>
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            {error || 'Results not found'}
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

  const { packs } = resultsData
  const totalStickers = packs.reduce((sum, pack) => sum + pack.stickers.length, 0)

  return (
    <div className="min-h-dvh bg-background">
      <Confetti />

      <header className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
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
            <SessionCounter />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <div className="text-center mb-8">
          <span className="text-primary font-medium text-sm uppercase tracking-widest">Complete</span>
          <h1 className="mt-2 text-3xl md:text-4xl font-bold text-foreground mb-3 text-balance">
            Your Sticker Packs Are Ready
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-pretty">
            {packs.length} pack{packs.length !== 1 ? 's' : ''} with {totalStickers} stickers generated.
            Download them individually or all at once.
          </p>
        </div>

        {downloadError && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center justify-between">
            <p className="text-sm text-destructive">{downloadError}</p>
            <button onClick={clearError} className="text-destructive hover:text-destructive/80 text-sm font-medium">
              Dismiss
            </button>
          </div>
        )}

        <div className="space-y-6 mb-8">
          {packs.map((pack) => (
            <StickerPackCard
              key={pack.id}
              packId={pack.id}
              styleName={pack.styleName}
              stickers={pack.stickers}
              onStickerClick={(sticker, index) => handleStickerClick(sticker, index, pack.stickers)}
              onDownload={() => handleDownloadPack(pack.id, pack.styleName)}
              isDownloading={isDownloading}
              currentDownload={currentDownload}
            />
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <DownloadAllButton
            onDownload={handleDownloadAll}
            isDownloading={isDownloading}
            currentDownload={currentDownload}
            packCount={packs.length}
          />

          <Button variant="outline" size="lg" onClick={() => setIsMarketplaceModalOpen(true)} className="min-w-[200px]">
            <Store className="size-4 mr-2" />
            Export for LINE
          </Button>
        </div>

        <div className="flex justify-center gap-4 mt-6">
          <Button variant="ghost" onClick={() => router.push('/create')}>
            <Sparkles className="size-4 mr-2" />
            Create More Stickers
          </Button>
          <Button variant="ghost" onClick={() => router.push('/history')}>
            <History className="size-4 mr-2" />
            View History
          </Button>
        </div>
      </main>

      <StickerModal
        isOpen={isStickerModalOpen}
        onClose={() => setIsStickerModalOpen(false)}
        sticker={selectedSticker}
        stickers={selectedPackStickers}
        currentIndex={currentStickerIndex}
        onNavigate={handleStickerNavigate}
        onDownload={downloadSingleSticker}
        isDownloading={isDownloading}
      />

      <MarketplaceExportModal
        isOpen={isMarketplaceModalOpen}
        onClose={() => setIsMarketplaceModalOpen(false)}
        onExport={handleMarketplaceExport}
        isExporting={isDownloading && currentDownload === 'marketplace package'}
        stickerCount={totalStickers}
        packCount={packs.length}
      />
    </div>
  )
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="size-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
              <Loader2 className="size-8 text-primary animate-spin" />
            </div>
            <p className="text-muted-foreground">Loading your stickers...</p>
          </div>
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  )
}
