'use client'

import { Clock, AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/src/lib/utils/cn'

interface SelectionSummaryProps {
  selectedCount: number
  estimatedTime: number
  maxSelection?: number
}

export function SelectionSummary({
  selectedCount,
  estimatedTime,
  maxSelection = 5,
}: SelectionSummaryProps) {
  const hasSelection = selectedCount > 0

  return (
    <div
      className={cn(
        'flex items-center justify-between px-4 py-3 rounded-xl',
        hasSelection ? 'bg-secondary border border-border' : 'bg-muted border border-border'
      )}
    >
      <div className="flex items-center gap-3">
        {hasSelection ? (
          <CheckCircle2 className="size-5 text-primary" />
        ) : (
          <AlertCircle className="size-5 text-muted-foreground" />
        )}
        <span className={cn('font-medium', hasSelection ? 'text-foreground' : 'text-muted-foreground')}>
          {selectedCount === 0
            ? 'Select at least 1 style'
            : `${selectedCount} style${selectedCount > 1 ? 's' : ''} selected`}
        </span>
      </div>

      {hasSelection && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="size-4" />
          <span className="tabular-nums">Est. {estimatedTime} min</span>
        </div>
      )}

      {!hasSelection && (
        <span className="text-sm text-muted-foreground">Max {maxSelection} styles</span>
      )}
    </div>
  )
}
