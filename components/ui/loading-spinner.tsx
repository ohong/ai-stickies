import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  className?: string
  size?: "sm" | "md" | "lg"
  variant?: "spinner" | "dots"
}

function LoadingSpinner({
  className,
  size = "md",
  variant = "spinner"
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  }

  if (variant === "dots") {
    const dotSizes = {
      sm: "w-1.5 h-1.5",
      md: "w-2.5 h-2.5",
      lg: "w-3.5 h-3.5",
    }

    return (
      <div className={cn("flex items-center gap-1", className)}>
        <div
          className={cn(
            dotSizes[size],
            "rounded-full bg-primary animate-bounce-soft"
          )}
          style={{ animationDelay: "0ms" }}
        />
        <div
          className={cn(
            dotSizes[size],
            "rounded-full bg-primary animate-bounce-soft"
          )}
          style={{ animationDelay: "150ms" }}
        />
        <div
          className={cn(
            dotSizes[size],
            "rounded-full bg-primary animate-bounce-soft"
          )}
          style={{ animationDelay: "300ms" }}
        />
      </div>
    )
  }

  return (
    <div className={cn("relative", sizeClasses[size], className)}>
      <div
        className={cn(
          "absolute inset-0 rounded-full border-2 border-primary/20"
        )}
      />
      <div
        className={cn(
          "absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin-slow"
        )}
      />
    </div>
  )
}

export { LoadingSpinner }
