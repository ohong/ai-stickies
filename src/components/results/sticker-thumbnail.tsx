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
    <button
      type="button"
      aria-label={`View ${emotion || 'sticker'} details`}
      className={cn(
        'relative aspect-square rounded-xl overflow-hidden cursor-pointer',
        'bg-secondary border border-border',
        'hover:border-primary',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
      )}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
    >
      {!isLoaded && (
        <div className="absolute inset-0 bg-muted" />
      )}

      <img
        src={imageUrl}
        alt={emotion || 'Sticker'}
        width={370}
        height={320}
        className={cn(
          'w-full h-full object-cover',
          isLoaded ? 'opacity-100' : 'opacity-0'
        )}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
      />

      {/* Always visible on mobile, hover-only on desktop */}
      <div className={cn(
        'absolute inset-x-0 bottom-0 bg-foreground/80 p-1.5 sm:p-2',
        'sm:opacity-0 sm:transition-opacity',
        isHovered && 'sm:opacity-100'
      )}>
        <div className="text-background text-[11px] sm:text-xs font-medium truncate w-full">
          {emotion || 'Sticker'}
          {textContent && (
            <span className="hidden sm:block text-background/70 text-[10px] truncate">
              {textContent}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

export function StickerThumbnailSkeleton() {
  return (
    <div className="aspect-square rounded-xl bg-muted" />
  )
}
