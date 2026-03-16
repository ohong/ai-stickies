'use client'

import { getShareUrl, getTwitterShareUrl, getLineShareUrl, getWhatsAppShareUrl } from '@/src/lib/utils/share'

interface SocialShareLinksProps {
  slug: string
  packName: string
}

export function SocialShareLinks({ slug, packName }: SocialShareLinksProps) {
  const url = getShareUrl(slug)
  const text = `Check out my ${packName} sticker pack, made with AI Stickies!`

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground">Share:</span>
      <a
        href={getTwitterShareUrl(url, text)}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Share on X"
      >
        X
      </a>
      <a
        href={getLineShareUrl(url)}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Share on LINE"
      >
        LINE
      </a>
      <a
        href={getWhatsAppShareUrl(url, text)}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Share on WhatsApp"
      >
        WhatsApp
      </a>
    </div>
  )
}
