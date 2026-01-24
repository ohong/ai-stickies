'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Clock, Package, Loader2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SessionCounter } from '@/app/components/create'
import { useSession } from '@/src/hooks/use-session'

interface HistoryItem {
  generationId: string
  createdAt: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  styleCount?: number
}

export default function HistoryPage() {
  const router = useRouter()
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const {
    remainingGenerations,
    maxGenerations,
    isLoading: sessionLoading,
  } = useSession()

  useEffect(() => {
    async function fetchHistory() {
      try {
        const response = await fetch('/api/session')
        if (!response.ok) throw new Error('Failed to load history')
        const data = await response.json()
        if (data.success) {
          setHistory(data.data.history || [])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load')
      } finally {
        setIsLoading(false)
      }
    }
    fetchHistory()
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusBadge = (status: HistoryItem['status']) => {
    switch (status) {
      case 'completed':
        return <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">Completed</span>
      case 'processing':
        return <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">Processing</span>
      case 'pending':
        return <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-700">Pending</span>
      case 'failed':
        return <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700">Failed</span>
    }
  }

  const completedGenerations = history.filter(h => h.status === 'completed')

  return (
    <div className="min-h-dvh bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="size-7 rounded-lg bg-primary flex items-center justify-center">
                <svg className="size-4 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="font-bold text-foreground">AI Stickies</span>
            </Link>
            <SessionCounter />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="size-4 mr-1" />
            Back
          </Button>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Generation History</h1>
          <p className="text-muted-foreground">
            View and re-download your previous sticker packs
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-8 text-primary animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-destructive mb-4">{error}</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        ) : completedGenerations.length === 0 ? (
          <div className="text-center py-16 bg-secondary/30 rounded-xl border border-border">
            <Package className="size-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No generations yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first sticker pack to see it here
            </p>
            <Button onClick={() => router.push('/create')}>
              Create Stickers
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {completedGenerations.map((item) => (
              <Link
                key={item.generationId}
                href={`/create/results?generationId=${item.generationId}`}
                className="block p-4 bg-card rounded-xl border border-border hover:border-primary/50 hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-lg bg-secondary flex items-center justify-center">
                      <Package className="size-6 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">
                          Sticker Pack{item.styleCount && item.styleCount > 1 ? 's' : ''}
                        </span>
                        {getStatusBadge(item.status)}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                        <Clock className="size-3" />
                        {formatDate(item.createdAt)}
                        {item.styleCount && (
                          <span className="ml-2">
                            {item.styleCount} style{item.styleCount > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <ExternalLink className="size-5 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-8 p-4 bg-secondary/30 rounded-xl border border-border">
          <p className="text-sm text-muted-foreground text-center">
            History expires after 24 hours. Download your packs before they expire.
          </p>
        </div>
      </main>
    </div>
  )
}
