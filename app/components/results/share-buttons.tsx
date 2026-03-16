'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Share2, Check, Link as LinkIcon } from 'lucide-react'
import { getShareUrl, getTwitterShareUrl, getLineShareUrl, getWhatsAppShareUrl } from '@/src/lib/utils/share'
import { parseApiResponse } from '@/src/lib/utils/http'

interface ShareButtonsProps {
  packId: string
  shareSlug: string | null
  packName: string
}

export function ShareButtons({ packId, shareSlug: initialSlug, packName }: ShareButtonsProps) {
  const [slug, setSlug] = useState(initialSlug)
  const [isPublishing, setIsPublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handlePublish = useCallback(async () => {
    setIsPublishing(true)
    setError(null)

    try {
      const response = await fetch(`/api/packs/${packId}/share`, { method: 'POST' })
      const data = await parseApiResponse<{ slug: string; shareUrl: string }>(
        response,
        'Failed to publish'
      )
      setSlug(data.slug)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish')
    } finally {
      setIsPublishing(false)
    }
  }, [packId])

  const handleCopyLink = useCallback(async () => {
    if (!slug) return
    const url = getShareUrl(slug)
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: open in new tab
      window.open(url, '_blank')
    }
  }, [slug])

  if (!slug) {
    return (
      <div className="flex flex-col items-start gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePublish}
          disabled={isPublishing}
          className="text-xs h-8"
        >
          <Share2 className="size-3 mr-1" />
          {isPublishing ? 'Publishing...' : 'Share'}
        </Button>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    )
  }

  const url = getShareUrl(slug)
  const text = `Check out my ${packName} sticker pack, made with AI Stickies!`

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopyLink}
        className="text-xs h-8"
      >
        {copied ? (
          <>
            <Check className="size-3 mr-1" />
            Copied
          </>
        ) : (
          <>
            <LinkIcon className="size-3 mr-1" />
            Copy Link
          </>
        )}
      </Button>
      <a
        href={getTwitterShareUrl(url, text)}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
      >
        X
      </a>
      <a
        href={getLineShareUrl(url)}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
      >
        LINE
      </a>
      <a
        href={getWhatsAppShareUrl(url, text)}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
      >
        WhatsApp
      </a>
    </div>
  )
}
