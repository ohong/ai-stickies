import { LoadingSpinner } from '@/components/ui/loading-spinner'

export default function CreateLoading() {
  return (
    <div className="min-h-dvh bg-background flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <p className="text-muted-foreground">Preparing your workspace...</p>
      </div>
    </div>
  )
}
