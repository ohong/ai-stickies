'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

// Sticker data with positions around the hero text (roughly circular)
// hideOnMobile: true = hidden on screens < 768px
const stickers = [
  // Top area - always visible
  { src: '/landing/sticker-wave.png', alt: 'Waving', top: '5%', left: '10%', delay: 0, size: 90, hideOnMobile: false },
  { src: '/landing/sticker-heart.png', alt: 'Heart', top: '8%', left: '78%', delay: 0.5, size: 85, hideOnMobile: false },
  { src: '/landing/sticker-cat.png', alt: 'Cat', top: '2%', left: '45%', delay: 1, size: 80, hideOnMobile: true },

  // Left side
  { src: '/landing/sticker-coffee.png', alt: 'Coffee', top: '30%', left: '3%', delay: 1.5, size: 95, hideOnMobile: true },
  { src: '/landing/sticker-thinking.png', alt: 'Thinking', top: '55%', left: '5%', delay: 2, size: 85, hideOnMobile: true },

  // Right side
  { src: '/landing/sticker-celebrate.png', alt: 'Celebrate', top: '25%', left: '85%', delay: 2.5, size: 90, hideOnMobile: true },
  { src: '/landing/sticker-love.png', alt: 'Love', top: '50%', left: '88%', delay: 3, size: 80, hideOnMobile: true },

  // Bottom area - some visible on mobile
  { src: '/landing/sticker-thumbsup.png', alt: 'Thumbs up', top: '78%', left: '8%', delay: 3.5, size: 85, hideOnMobile: false },
  { src: '/landing/sticker-peace.png', alt: 'Peace', top: '75%', left: '82%', delay: 4, size: 90, hideOnMobile: false },
  { src: '/landing/sticker-star.png', alt: 'Star', top: '72%', left: '50%', delay: 4.5, size: 75, hideOnMobile: true },

  // Extra floating ones - desktop only
  { src: '/landing/sticker-sleepy.png', alt: 'Sleepy', top: '42%', left: '1%', delay: 5, size: 70, hideOnMobile: true },
  { src: '/landing/sticker-shy.png', alt: 'Shy', top: '38%', left: '92%', delay: 5.5, size: 75, hideOnMobile: true },
]

interface FloatingStickerProps {
  src: string
  alt: string
  top: string
  left: string
  delay: number
  size: number
  isVisible: boolean
  hideOnMobile?: boolean
}

function FloatingSticker({ src, alt, top, left, delay, size, isVisible, hideOnMobile }: FloatingStickerProps) {
  return (
    <div
      className={`absolute pointer-events-none transition-all duration-1000 ease-out ${hideOnMobile ? 'hidden md:block' : ''}`}
      style={{
        top,
        left,
        opacity: isVisible ? 1 : 0,
        transform: isVisible
          ? 'scale(1) translateY(0)'
          : 'scale(0.5) translateY(20px)',
        transitionDelay: `${delay * 150}ms`,
      }}
    >
      <div
        className="animate-float"
        style={{
          animationDelay: `${delay * 0.3}s`,
          animationDuration: `${3 + delay * 0.5}s`,
        }}
      >
        <Image
          src={src}
          alt={alt}
          width={size}
          height={size}
          className="drop-shadow-lg"
          priority={delay < 2}
        />
      </div>
    </div>
  )
}

export function FloatingStickers() {
  const [isVisible, setIsVisible] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Stagger the appearance
    const timer = setTimeout(() => setIsVisible(true), 300)
    return () => clearTimeout(timer)
  }, [])

  if (!mounted) return null

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stickers.map((sticker, index) => (
        <FloatingSticker
          key={index}
          {...sticker}
          isVisible={isVisible}
        />
      ))}
    </div>
  )
}
