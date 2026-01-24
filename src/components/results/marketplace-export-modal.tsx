'use client'

import { useState } from 'react'
import {
  Check,
  Download,
  ExternalLink,
  Loader2,
  Package,
  FileCheck,
  Image,
  Layers,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface MarketplaceExportModalProps {
  isOpen: boolean
  onClose: () => void
  onExport: () => void
  isExporting?: boolean
  stickerCount?: number
  packCount?: number
}

const requirements = [
  {
    id: 'format',
    icon: FileCheck,
    label: 'PNG format with transparency',
    description: 'All stickers exported as transparent PNGs',
  },
  {
    id: 'size',
    icon: Image,
    label: 'Correct dimensions (370x320px)',
    description: 'Stickers resized to LINE requirements',
  },
  {
    id: 'count',
    icon: Layers,
    label: '8-40 stickers per set',
    description: 'Your pack meets the minimum count',
  },
  {
    id: 'main',
    icon: Package,
    label: 'Main image included (240x240px)',
    description: 'Pack thumbnail generated automatically',
  },
]

const submissionSteps = [
  {
    step: 1,
    title: 'Create Account',
    description: 'Sign up for LINE Creators Market',
  },
  {
    step: 2,
    title: 'New Submission',
    description: 'Click "New Submission" and select "Stickers"',
  },
  {
    step: 3,
    title: 'Upload Files',
    description: 'Upload the ZIP file from this export',
  },
  {
    step: 4,
    title: 'Add Details',
    description: 'Fill in title, description, and pricing',
  },
  {
    step: 5,
    title: 'Submit for Review',
    description: 'Submit and wait for approval (1-7 days)',
  },
]

export function MarketplaceExportModal({
  isOpen,
  onClose,
  onExport,
  isExporting,
  stickerCount = 10,
  packCount = 1,
}: MarketplaceExportModalProps) {
  const [showGuide, setShowGuide] = useState(false)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="size-5 text-primary" />
            Export for LINE Marketplace
          </DialogTitle>
          <DialogDescription>
            Download your stickers formatted for LINE Creators Market submission.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <h4 className="text-sm font-medium text-foreground">
            Requirements Check
          </h4>
          <div className="space-y-2">
            {requirements.map((req) => (
              <div
                key={req.id}
                className="flex items-start gap-3 p-2 rounded-lg bg-emerald-50"
              >
                <div className="size-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="size-3 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{req.label}</p>
                  <p className="text-xs text-muted-foreground">{req.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center gap-6 py-3 px-4 bg-secondary rounded-xl">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary tabular-nums">{packCount}</p>
            <p className="text-xs text-muted-foreground">Pack{packCount !== 1 ? 's' : ''}</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <p className="text-2xl font-bold text-primary tabular-nums">{stickerCount}</p>
            <p className="text-xs text-muted-foreground">Stickers</p>
          </div>
        </div>

        <button
          onClick={() => setShowGuide(!showGuide)}
          className="w-full text-left text-sm text-primary hover:underline flex items-center gap-1"
        >
          {showGuide ? 'Hide' : 'Show'} submission guide
          <ExternalLink className="size-3" />
        </button>

        {showGuide && (
          <div className="space-y-2 py-2 border-t border-border">
            <h4 className="text-sm font-medium text-foreground">
              How to Submit to LINE Creators Market
            </h4>
            <ol className="space-y-2">
              {submissionSteps.map((step) => (
                <li key={step.step} className="flex gap-3">
                  <span className="size-5 rounded-full bg-secondary text-primary text-xs font-bold flex items-center justify-center shrink-0 tabular-nums">
                    {step.step}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{step.title}</p>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={onExport}
            disabled={isExporting}
            className="w-full sm:w-auto"
          >
            {isExporting ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Preparing...
              </>
            ) : (
              <>
                <Download className="size-4 mr-2" />
                Download Marketplace ZIP
              </>
            )}
          </Button>
        </DialogFooter>

        <div className="text-center pt-2 border-t border-border">
          <a
            href="https://creator.line.me/en/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1"
          >
            Open LINE Creators Market
            <ExternalLink className="size-3" />
          </a>
        </div>
      </DialogContent>
    </Dialog>
  )
}
