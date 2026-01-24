'use client'

import { observer, Memo } from '@legendapp/state/react'
import { Loader2, X } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { generationState$ } from '@/src/lib/state'

export const GenerationProgress = observer(() => {
  const totalStyles = 5
  const progress = generationState$.progress.get()
  const currentStyle = generationState$.currentStyle.get()
  const currentIndex = Math.min(Math.floor((progress / 100) * totalStyles) + 1, totalStyles)

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-card rounded-xl border border-border shadow-sm">
      <div className="flex items-center justify-center mb-6">
        <div className="size-16 rounded-full bg-secondary flex items-center justify-center">
          <Loader2 className="size-8 text-primary animate-spin" />
        </div>
      </div>

      <h3 className="text-lg font-semibold text-foreground text-center mb-2 text-balance">
        Generating Previews
      </h3>

      <p className="text-sm text-muted-foreground text-center mb-6">
        {currentStyle
          ? `Creating ${currentStyle} style... (${currentIndex}/${totalStyles})`
          : 'Preparing generation...'}
      </p>

      <Progress 
        value={progress} 
        className="mb-4"
      />

      <p className="text-xs text-muted-foreground text-center mb-4 tabular-nums">
        <Memo>{() => `${progress}% complete`}</Memo>
      </p>

      <div className="flex justify-center">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="size-4 mr-1" />
          Cancel
        </Button>
      </div>
    </div>
  )
})
