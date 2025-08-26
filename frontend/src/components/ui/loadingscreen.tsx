import * as React from "react"
import { cn } from "@/lib/utils"
import { Spinner } from "./spinner"

interface LoadingScreenProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string
  fullScreen?: boolean
}

const LoadingScreen = React.forwardRef<HTMLDivElement, LoadingScreenProps>(
  ({ className, message = "Loading...", fullScreen = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center space-y-4",
          fullScreen ? "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" : "py-12",
          className
        )}
        {...props}
      >
        <Spinner size="lg" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    )
  }
)
LoadingScreen.displayName = "LoadingScreen"

export { LoadingScreen }