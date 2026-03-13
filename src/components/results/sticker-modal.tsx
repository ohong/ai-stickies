'use client'

import { ChevronLeft, ChevronRight, Download } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/src/lib/utils/cn'

interface StickerData {
  id: string
  imageUrl: string
  emotion: string | null
  textContent: string | null
  sequenceNumber: number
}

interface StickerModalProps {
  isOpen: boolean
  onClose: () => void
  sticker: StickerData | null
  stickers: StickerData[]
  currentIndex: number
  onNavigate: (index: number) => void
  onDownload: (imageUrl: string, emotion: string) => void
  isDownloading?: boolean
}

export function StickerModal({
  isOpen,
  onClose,
  sticker,
  stickers,
  currentIndex,
  onNavigate,
  onDownload,
  isDownloading,
}: StickerModalProps) {
  if (!sticker) return null

  const canGoPrev = currentIndex > 0
  const canGoNext = currentIndex < stickers.length - 1

  const handlePrev = () => {
    if (canGoPrev) onNavigate(currentIndex - 1)
  }

  const handleNext = () => {
    if (canGoNext) onNavigate(currentIndex + 1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') handlePrev()
    if (e.key === 'ArrowRight') handleNext()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-2xl p-0 overflow-hidden !rounded-t-2xl sm:!rounded-2xl !pb-[env(safe-area-inset-bottom)]"
        onKeyDown={handleKeyDown}
      >
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="text-center text-balance">
            {sticker.emotion || `Sticker ${sticker.sequenceNumber}`}
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          <button
            onClick={handlePrev}
            disabled={!canGoPrev}
            className={cn(
              'absolute left-2 top-1/2 -translate-y-1/2 z-10',
              'size-11 sm:size-10 rounded-full bg-card/90 shadow-md',
              'flex items-center justify-center',
              'active:scale-95 transition-transform',
              canGoPrev
                ? 'hover:bg-card cursor-pointer'
                : 'opacity-30 cursor-not-allowed'
            )}
            aria-label="Previous sticker"
          >
            <ChevronLeft className="size-5 text-foreground" />
          </button>

          <button
            onClick={handleNext}
            disabled={!canGoNext}
            className={cn(
              'absolute right-2 top-1/2 -translate-y-1/2 z-10',
              'size-11 sm:size-10 rounded-full bg-card/90 shadow-md',
              'flex items-center justify-center',
              'active:scale-95 transition-transform',
              canGoNext
                ? 'hover:bg-card cursor-pointer'
                : 'opacity-30 cursor-not-allowed'
            )}
            aria-label="Next sticker"
          >
            <ChevronRight className="size-5 text-foreground" />
          </button>

          <div className="aspect-square max-h-[50dvh] sm:max-h-[60vh] mx-auto p-4">
            <img
              src={sticker.imageUrl}
              alt={sticker.emotion || 'Sticker'}
              className="w-full h-full object-contain rounded-xl"
            />
          </div>
        </div>

        <div className="px-4 pb-4 pt-0 space-y-3">
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <span className="tabular-nums">#{sticker.sequenceNumber} of {stickers.length}</span>
            {sticker.textContent && (
              <>
                <span className="size-1 rounded-full bg-border" />
                <span className="italic truncate max-w-[200px]">"{sticker.textContent}"</span>
              </>
            )}
          </div>

          <div className="flex justify-center">
            <Button
              onClick={() => onDownload(sticker.imageUrl, sticker.emotion || 'sticker')}
              disabled={isDownloading}
              className="w-full sm:w-auto min-w-[200px] h-12 sm:h-10"
            >
              <Download className="size-4 mr-2" />
              {isDownloading ? 'Downloading...' : 'Download Sticker'}
            </Button>
          </div>

          <div className="flex justify-center gap-2 sm:gap-1.5 pt-2 flex-wrap">
            {stickers.map((s, i) => (
              <button
                key={s.id}
                onClick={() => onNavigate(i)}
                className={cn(
                  'size-3 sm:size-2 rounded-full',
                  i === currentIndex
                    ? 'bg-primary'
                    : 'bg-muted hover:bg-muted-foreground/30'
                )}
                aria-label={`Go to sticker ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
