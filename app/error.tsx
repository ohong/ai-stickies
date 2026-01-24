'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw, Home, AlertTriangle } from 'lucide-react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-dvh bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="size-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="size-8 text-destructive" />
        </div>

        <h2 className="text-2xl font-bold text-foreground mb-3">
          Something went wrong
        </h2>

        <p className="text-muted-foreground mb-6">
          We encountered an unexpected error. Please try again or return to the home page.
        </p>

        {error.digest && (
          <p className="text-xs text-muted-foreground mb-6 font-mono">
            Error ID: {error.digest}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} className="w-full sm:w-auto">
            <RefreshCw className="size-4 mr-2" />
            Try Again
          </Button>

          <Button
            variant="outline"
            onClick={() => window.location.href = '/'}
            className="w-full sm:w-auto"
          >
            <Home className="size-4 mr-2" />
            Go Home
          </Button>
        </div>
      </div>
    </div>
  )
}
