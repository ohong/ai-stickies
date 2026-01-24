'use client'

import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface StyleInputProps {
  value: string
  onChange: (value: string) => void
  maxLength?: number
  disabled?: boolean
}

export function StyleInput({
  value,
  onChange,
  maxLength = 500,
  disabled,
}: StyleInputProps) {
  const remaining = maxLength - value.length
  const isNearLimit = remaining < 50
  const isAtLimit = remaining <= 0

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        Style Description
        <span className="text-muted-foreground font-normal ml-1">(optional)</span>
      </label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
        placeholder="Describe your style preferences... e.g., 'cute anime style with big sparkly eyes' or 'minimalist line art with pastel colors'"
        disabled={disabled}
        className="min-h-[100px]"
      />
      <div className="flex justify-end">
        <span
          className={cn(
            'text-xs tabular-nums',
            isAtLimit
              ? 'text-destructive font-medium'
              : isNearLimit
              ? 'text-amber-600'
              : 'text-muted-foreground'
          )}
        >
          {remaining} characters remaining
        </span>
      </div>
    </div>
  )
}
