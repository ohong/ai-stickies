'use client'

import Image from 'next/image'
import { X, FileImage } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ImagePreviewProps {
  imageUrl: string
  filename: string
  size: number
  onRemove: () => void
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function ImagePreview({
  imageUrl,
  filename,
  size,
  onRemove,
}: ImagePreviewProps) {
  return (
    <div className="relative w-full rounded-xl overflow-hidden bg-secondary border border-border">
      <div className="aspect-square relative">
        <Image
          src={imageUrl}
          alt="Uploaded preview"
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>

      <Button
        variant="destructive"
        size="icon"
        onClick={onRemove}
        className="absolute top-3 right-3 size-8 rounded-full shadow-md"
        aria-label="Remove image"
      >
        <X className="size-4" />
      </Button>

      <div className="absolute bottom-0 left-0 right-0 p-3 bg-card/95 backdrop-blur-sm border-t border-border">
        <div className="flex items-center gap-2 text-foreground">
          <FileImage className="size-4 text-primary" />
          <span className="text-sm font-medium truncate flex-1">{filename}</span>
          <span className="text-xs text-muted-foreground tabular-nums">{formatFileSize(size)}</span>
        </div>
      </div>
    </div>
  )
}
