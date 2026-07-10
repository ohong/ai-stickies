'use client'

import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useDownload } from '@/src/hooks/use-download'
import { Download } from 'lucide-react'
import type { PackWithStickers } from '@/src/lib/services/share.service'
import { SocialShareLinks } from './social-share-links'

interface PublicPackViewProps {
  pack: PackWithStickers
  slug: string
}

export function PublicPackView({ pack, slug }: PublicPackViewProps) {
  const { isDownloading, downloadPack, currentDownload } = useDownload()

  return (
    <>
      <Card className="overflow-hidden mb-6">
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-3">
            {pack.stickers.map((sticker) => (
              <div
                key={sticker.id}
                className="relative aspect-square rounded-xl overflow-hidden bg-secondary border border-border"
              >
                <Image
                  src={sticker.imageUrl}
                  alt={sticker.emotion || 'Sticker'}
                  width={370}
                  height={320}
                  sizes="(max-width: 640px) 30vw, (max-width: 768px) 22vw, 160px"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {sticker.emotion && (
                  <div className="absolute inset-x-0 bottom-0 bg-foreground/80 p-1.5">
                    <span className="text-background text-[11px] font-medium truncate block">
                      {sticker.emotion}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col items-center gap-4">
        <Button
          size="lg"
          onClick={() => downloadPack(pack.id, pack.style_name)}
          disabled={isDownloading}
          className="min-w-[200px]"
        >
          <Download className="size-4 mr-2" />
          {isDownloading && currentDownload === pack.style_name
            ? 'Downloading...'
            : 'Download Pack'}
        </Button>

        <SocialShareLinks slug={slug} packName={pack.style_name} />
      </div>
    </>
  )
}
