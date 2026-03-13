'use client'

import { useCallback, useRef } from 'react'
import { Upload, Image as ImageIcon } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { storageConfig } from '@/src/lib/config'

interface ImageUploaderProps {
  onUpload: (file: File) => Promise<boolean>
  isUploading: boolean
  uploadProgress: number
  disabled?: boolean
}

export function ImageUploader({
  onUpload,
  isUploading,
  uploadProgress,
  disabled,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      if (disabled || isUploading) return

      const file = e.dataTransfer.files[0]
      if (file) {
        await onUpload(file)
      }
    },
    [onUpload, disabled, isUploading]
  )

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }, [])

  const handleClick = useCallback(() => {
    if (disabled || isUploading) return
    inputRef.current?.click()
  }, [disabled, isUploading])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (disabled || isUploading) return
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        inputRef.current?.click()
      }
    },
    [disabled, isUploading]
  )

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        await onUpload(file)
      }
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    },
    [onUpload]
  )

  const acceptTypes = storageConfig.allowedMimeTypes.join(',')

  return (
    <div
      role="button"
      tabIndex={disabled || isUploading ? -1 : 0}
      aria-label="Upload photo. Drop file here or press Enter to browse"
      aria-disabled={disabled || isUploading}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'relative flex flex-col items-center justify-center',
        'w-full py-8 sm:py-12 px-4 sm:px-6',
        'border-2 border-dashed rounded-xl',
        'cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        disabled || isUploading
          ? 'border-muted bg-muted/50 cursor-not-allowed'
          : 'border-border bg-secondary/30 hover:border-primary hover:bg-secondary/60'
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={acceptTypes}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {isUploading ? (
        <div className="flex flex-col items-center gap-3 w-full max-w-xs" aria-live="polite">
          <Upload className="size-8 text-primary" aria-hidden="true" />
          <p className="text-sm font-medium text-foreground">Uploading...</p>
          <Progress value={uploadProgress} className="w-full" />
          <p className="text-xs text-muted-foreground tabular-nums">{uploadProgress}%</p>
        </div>
      ) : (
        <>
          <ImageIcon className="size-8 sm:size-10 text-muted-foreground mb-2 sm:mb-3" aria-hidden="true" />
          <p className="text-sm font-medium text-foreground mb-1">
            <span className="sm:hidden">Tap to upload a photo</span>
            <span className="hidden sm:inline">Drop your photo here</span>
          </p>
          <p className="text-xs text-muted-foreground">
            JPG, PNG, or WebP up to {storageConfig.maxUploadSizeMb}MB
          </p>
        </>
      )}
    </div>
  )
}
