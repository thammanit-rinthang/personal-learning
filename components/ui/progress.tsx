import * as React from "react"
import { cn } from "@/lib/utils"

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  max?: number
}

export function Progress({ className, value, max = 100, ...props }: ProgressProps) {
  const percentage = Math.max(0, Math.min(100, (value / max) * 100))

  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-[var(--surface-subtle)]", className)}
      {...props}
    >
      <div
        className="h-full bg-[var(--primary)] transition-all duration-300 ease-in-out"
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}
