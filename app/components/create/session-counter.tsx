'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface SessionCounterProps {
  remaining: number
  total: number
  isLoading?: boolean
}

export function SessionCounter({
  remaining,
  total,
  isLoading,
}: SessionCounterProps) {
  const isLow = remaining < 3
  const isEmpty = remaining === 0

  if (isLoading) {
    return (
      <Badge variant="secondary" className="px-3 py-1.5">
        <span className="w-16 h-4 bg-muted rounded" />
      </Badge>
    )
  }

  return (
    <Badge
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5',
        isEmpty
          ? 'bg-muted text-muted-foreground border-border'
          : isLow
          ? 'bg-primary/10 text-primary border-primary/20'
          : 'bg-secondary text-foreground border-border'
      )}
      variant="outline"
    >
      <svg
        className="size-3.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
      <span className="font-medium tabular-nums">
        {remaining}/{total} remaining
      </span>
    </Badge>
  )
}
