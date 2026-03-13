'use client'

import { Loader2 } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

interface GenerationProgressProps {
  progress: number
  currentStyle: string | null
  totalStyles?: number
  onCancel?: () => void
}

export function GenerationProgress({
  progress,
  currentStyle,
  totalStyles = 5,
  onCancel,
}: GenerationProgressProps) {
  const currentIndex = Math.min(Math.floor((progress / 100) * totalStyles) + 1, totalStyles)

  return (
    <div className="w-full p-5 bg-card rounded-xl border border-border shadow-sm" aria-live="polite">
      <div className="flex items-center gap-4 mb-4">
        <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Loader2 className="size-5 text-primary animate-spin" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground truncate">
            {currentStyle
              ? `Creating ${currentStyle} style...`
              : 'Preparing generation...'}
          </p>
          <p className="text-xs text-muted-foreground tabular-nums">
            {currentIndex} of {totalStyles} styles
          </p>
        </div>
        <span className="text-sm font-medium text-foreground tabular-nums shrink-0">
          {Math.round(progress)}%
        </span>
      </div>

      <Progress value={progress} />

      {onCancel && (
        <div className="flex justify-end mt-3">
          <button
            onClick={onCancel}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
