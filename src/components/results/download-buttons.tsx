'use client'

import { Download, Package, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/src/lib/utils/cn'

interface DownloadPackButtonProps {
  packName: string
  onDownload: () => void
  isDownloading?: boolean
  currentDownload?: string | null
  size?: 'default' | 'sm'
}

export function DownloadPackButton({
  packName,
  onDownload,
  isDownloading,
  currentDownload,
  size = 'default',
}: DownloadPackButtonProps) {
  const isThisDownloading = isDownloading && currentDownload === packName

  return (
    <Button
      variant="outline"
      size={size}
      onClick={onDownload}
      disabled={isDownloading}
      className={cn(size === 'sm' && 'text-xs')}
    >
      {isThisDownloading ? (
        <Loader2 className="size-4 mr-2 animate-spin" />
      ) : (
        <Download className="size-4 mr-2" />
      )}
      {isThisDownloading ? 'Downloading...' : 'Download Pack'}
    </Button>
  )
}

interface DownloadAllButtonProps {
  onDownload: () => void
  isDownloading?: boolean
  currentDownload?: string | null
  packCount?: number
}

export function DownloadAllButton({
  onDownload,
  isDownloading,
  currentDownload,
  packCount = 0,
}: DownloadAllButtonProps) {
  const isThisDownloading = isDownloading && currentDownload === 'all packs'

  return (
    <Button
      size="lg"
      onClick={onDownload}
      disabled={isDownloading || packCount === 0}
      className="min-w-[200px] shadow-md"
    >
      {isThisDownloading ? (
        <Loader2 className="size-4 mr-2 animate-spin" />
      ) : (
        <Package className="size-4 mr-2" />
      )}
      {isThisDownloading
        ? 'Preparing ZIP...'
        : `Download All${packCount > 0 ? ` (${packCount} packs)` : ''}`}
    </Button>
  )
}
