'use client'

import { useState } from 'react'
import { Download, Loader2, MessageCircle, Send, MessageSquare, Smartphone } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { Platform } from '@/src/constants/platform-specs'

interface PlatformOption {
  id: Platform
  name: string
  icon: typeof MessageCircle
  format: string
  dimensions: string
  maxSize: string
}

const platformOptions: PlatformOption[] = [
  {
    id: 'line',
    name: 'LINE',
    icon: MessageCircle,
    format: 'PNG',
    dimensions: '370x320',
    maxSize: '1MB',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: MessageSquare,
    format: 'WebP',
    dimensions: '512x512',
    maxSize: '100KB',
  },
  {
    id: 'telegram',
    name: 'Telegram',
    icon: Send,
    format: 'WebP',
    dimensions: '512x512',
    maxSize: '256KB',
  },
  {
    id: 'imessage',
    name: 'iMessage',
    icon: Smartphone,
    format: 'PNG',
    dimensions: '618x618',
    maxSize: '500KB',
  },
]

interface PlatformExportModalProps {
  isOpen: boolean
  onClose: () => void
  onExport: (platform: Platform) => void
  isExporting?: boolean
  exportingPlatform?: Platform | null
}

export function PlatformExportModal({
  isOpen,
  onClose,
  onExport,
  isExporting,
  exportingPlatform,
}: PlatformExportModalProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('whatsapp')

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export for...</DialogTitle>
          <DialogDescription>
            Choose a platform to download your stickers in the correct format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          {platformOptions.map((option) => {
            const Icon = option.icon
            const isSelected = selectedPlatform === option.id
            const isCurrentlyExporting = isExporting && exportingPlatform === option.id

            return (
              <button
                key={option.id}
                onClick={() => setSelectedPlatform(option.id)}
                disabled={isExporting}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors text-left ${
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/30 hover:bg-secondary/50'
                } ${isExporting ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className={`size-10 rounded-lg flex items-center justify-center shrink-0 ${
                  isSelected ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                }`}>
                  {isCurrentlyExporting ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    <Icon className="size-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{option.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {option.format} &middot; {option.dimensions} &middot; max {option.maxSize}
                  </p>
                </div>
                <div className={`size-4 rounded-full border-2 shrink-0 ${
                  isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                }`}>
                  {isSelected && (
                    <div className="size-full rounded-full flex items-center justify-center">
                      <div className="size-1.5 rounded-full bg-primary-foreground" />
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isExporting}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={() => onExport(selectedPlatform)}
            disabled={isExporting}
            className="w-full sm:w-auto"
          >
            {isExporting ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="size-4 mr-2" />
                Download
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
