'use client'

import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface ContextInputProps {
  value: string
  onChange: (value: string) => void
  maxLength?: number
  disabled?: boolean
}

export function ContextInput({
  value,
  onChange,
  maxLength = 500,
  disabled,
}: ContextInputProps) {
  const remaining = maxLength - value.length
  const isNearLimit = remaining < 50
  const isAtLimit = remaining <= 0

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        Personal Context
        <span className="text-muted-foreground font-normal ml-1">(optional)</span>
      </label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
        placeholder="Tell us about yourself... e.g., 'I love coffee and cats' or 'I work as a software developer'. This helps create more personalized stickers."
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
