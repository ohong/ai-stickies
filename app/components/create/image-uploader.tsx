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
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={handleClick}
      className={cn(
        'relative flex flex-col items-center justify-center',
        'w-full min-h-[280px] p-8',
        'border-2 border-dashed rounded-xl',
        'cursor-pointer',
        disabled || isUploading
          ? 'border-muted bg-muted/50 cursor-not-allowed'
          : 'border-border bg-secondary/50 hover:border-primary hover:bg-secondary'
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
        <div className="flex flex-col items-center gap-4 w-full max-w-xs">
          <div className="size-16 rounded-full bg-secondary flex items-center justify-center">
            <Upload className="size-8 text-primary" />
          </div>
          <p className="text-sm font-medium text-foreground">Uploading...</p>
          <Progress value={uploadProgress} className="w-full" />
          <p className="text-xs text-muted-foreground tabular-nums">{uploadProgress}%</p>
        </div>
      ) : (
        <>
          <div className="size-20 rounded-full bg-secondary flex items-center justify-center mb-4">
            <ImageIcon className="size-10 text-primary" />
          </div>
          <p className="text-lg font-medium text-foreground mb-2">
            Drop your photo here
          </p>
          <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
          <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
            <span className="px-2 py-1 bg-card rounded-full border border-border">
              JPG
            </span>
            <span className="px-2 py-1 bg-card rounded-full border border-border">
              PNG
            </span>
            <span className="px-2 py-1 bg-card rounded-full border border-border">
              WebP
            </span>
            <span className="px-2 py-1 bg-card rounded-full border border-border">
              Max {storageConfig.maxUploadSizeMb}MB
            </span>
          </div>
        </>
      )}
    </div>
  )
}
