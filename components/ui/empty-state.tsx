import * as React from "react"
import { cn } from "@/lib/utils"

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode
  title: string
  description: string
  action?: React.ReactNode
}

export function EmptyState({ className, icon, title, description, action, ...props }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-subtle)] p-8 text-center",
        className
      )}
      {...props}
    >
      {icon && <div className="mb-4 text-[var(--muted-foreground)] flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface)] shadow-sm">{icon}</div>}
      <h3 className="mb-1 text-lg font-semibold text-[var(--foreground)]">{title}</h3>
      <p className="mb-4 max-w-sm text-sm text-[var(--muted-foreground)]">{description}</p>
      {action && <div>{action}</div>}
    </div>
  )
}
