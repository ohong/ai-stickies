'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/src/lib/utils/cn'

interface ConfettiPiece {
  id: number
  x: number
  delay: number
  duration: number
  color: string
  shape: 'circle' | 'square'
}

// Green-based celebration colors
const colors = [
  '#0CC755', // primary green
  '#10B981', // emerald
  '#34D399', // lighter green
  '#6EE7B7', // mint
  '#FCD34D', // gold accent
  '#60A5FA', // sky blue accent
]

export function Confetti() {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([])
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      setIsVisible(false)
      return
    }

    const newPieces: ConfettiPiece[] = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 2 + Math.random() * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      shape: Math.random() > 0.5 ? 'circle' : 'square',
    }))
    setPieces(newPieces)

    const timer = setTimeout(() => setIsVisible(false), 4000)
    return () => clearTimeout(timer)
  }, [])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className={cn(
            'absolute size-3 animate-[confetti-fall_linear_forwards]',
            piece.shape === 'circle' ? 'rounded-full' : 'rounded-sm'
          )}
          style={{
            left: `${piece.x}%`,
            backgroundColor: piece.color,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
          }}
        />
      ))}
    </div>
  )
}
