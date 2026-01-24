'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StickerThumbnail, StickerThumbnailSkeleton } from './sticker-thumbnail'
import { DownloadPackButton } from './download-buttons'

interface StickerData {
  id: string
  sequenceNumber: number
  imageUrl: string
  emotion: string | null
  hasText: boolean
  textContent: string | null
}

interface StickerPackCardProps {
  packId: string
  styleName: string
  stickers: StickerData[]
  onStickerClick: (sticker: StickerData, index: number) => void
  onDownload: () => void
  isDownloading?: boolean
  currentDownload?: string | null
}

export function StickerPackCard({
  styleName,
  stickers,
  onStickerClick,
  onDownload,
  isDownloading,
  currentDownload,
}: StickerPackCardProps) {
  const sortedStickers = [...stickers].sort((a, b) => a.sequenceNumber - b.sequenceNumber)

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">
            {styleName}
          </CardTitle>
          <DownloadPackButton
            packName={styleName}
            onDownload={onDownload}
            isDownloading={isDownloading}
            currentDownload={currentDownload}
            size="sm"
          />
        </div>
        <p className="text-sm text-muted-foreground tabular-nums">{stickers.length} stickers</p>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
          {sortedStickers.map((sticker, index) => (
            <StickerThumbnail
              key={sticker.id}
              imageUrl={sticker.imageUrl}
              emotion={sticker.emotion}
              textContent={sticker.textContent}
              onClick={() => onStickerClick(sticker, index)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function StickerPackCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="h-6 w-32 bg-muted rounded" />
          <div className="h-8 w-28 bg-muted rounded-full" />
        </div>
        <div className="h-4 w-20 bg-muted rounded mt-1" />
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <StickerThumbnailSkeleton key={i} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
