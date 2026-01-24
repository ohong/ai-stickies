import * as React from "react"
import { AlertCircle, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"

interface ErrorMessageProps {
  className?: string
  title?: string
  message: string
  onRetry?: () => void
  retryLabel?: string
}

function ErrorMessage({
  className,
  title = "Something went wrong",
  message,
  onRetry,
  retryLabel = "Try again",
}: ErrorMessageProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-2xl bg-red-50 dark:bg-red-950/30 border-2 border-red-200 dark:border-red-900 p-4 text-center",
        className
      )}
      role="alert"
    >
      <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
        <AlertCircle className="h-5 w-5" />
        <span className="font-medium">{title}</span>
      </div>
      <p className="text-sm text-red-600/80 dark:text-red-400/80">{message}</p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="mt-1 border-red-300 text-red-600 hover:bg-red-100 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950 dark:hover:text-red-300"
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          {retryLabel}
        </Button>
      )}
    </div>
  )
}

export { ErrorMessage }
