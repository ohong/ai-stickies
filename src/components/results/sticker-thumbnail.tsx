'use client'

import { useState } from 'react'
import { cn } from '@/src/lib/utils/cn'

interface StickerThumbnailProps {
  imageUrl: string
  emotion: string | null
  textContent: string | null
  onClick?: () => void
}

export function StickerThumbnail({
  imageUrl,
  emotion,
  textContent,
  onClick,
}: StickerThumbnailProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className={cn(
        'relative aspect-square rounded-xl overflow-hidden cursor-pointer',
        'bg-secondary border border-border',
        'hover:border-primary'
      )}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {!isLoaded && (
        <div className="absolute inset-0 bg-muted" />
      )}

      <img
        src={imageUrl}
        alt={emotion || 'Sticker'}
        className={cn(
          'w-full h-full object-cover',
          isLoaded ? 'opacity-100' : 'opacity-0'
        )}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
      />

      {isHovered && (
        <div className="absolute inset-x-0 bottom-0 bg-foreground/80 p-2">
          <div className="text-background text-xs font-medium truncate w-full">
            {emotion || 'Sticker'}
            {textContent && (
              <span className="block text-background/70 text-[10px] truncate">
                {textContent}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function StickerThumbnailSkeleton() {
  return (
    <div className="aspect-square rounded-xl bg-muted" />
  )
}
