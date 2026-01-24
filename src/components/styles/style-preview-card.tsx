'use client'

import { Check } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/src/lib/utils/cn'

interface StylePreviewCardProps {
  id: string
  styleName: string
  description: string
  previewUrl: string | null
  isSelected: boolean
  onToggle: (id: string) => void
  isLoading?: boolean
}

export function StylePreviewCard({
  id,
  styleName,
  description,
  previewUrl,
  isSelected,
  onToggle,
  isLoading,
}: StylePreviewCardProps) {
  return (
    <Card
      onClick={() => !isLoading && onToggle(id)}
      className={cn(
        'relative overflow-hidden cursor-pointer',
        isSelected
          ? 'ring-2 ring-primary ring-offset-2 bg-secondary/50'
          : 'hover:ring-1 hover:ring-border',
        isLoading && 'opacity-50 cursor-not-allowed'
      )}
    >
      <div
        className={cn(
          'absolute top-3 right-3 z-10 size-6 rounded-full',
          'flex items-center justify-center',
          isSelected
            ? 'bg-primary text-primary-foreground'
            : 'bg-card/80 border-2 border-border'
        )}
      >
        {isSelected && <Check className="size-4" />}
      </div>

      <div className="aspect-square relative bg-secondary">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="size-12 rounded-full border-2 border-border border-t-primary animate-spin" />
          </div>
        ) : previewUrl ? (
          <img
            src={previewUrl}
            alt={`${styleName} preview`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-4xl text-muted-foreground">?</div>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-foreground mb-1">{styleName}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
      </div>
    </Card>
  )
}
