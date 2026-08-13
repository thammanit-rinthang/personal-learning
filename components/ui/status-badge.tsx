import * as React from "react"
import { cn } from "@/lib/utils"

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "draft" | "review" | "published" | "archived" | "success" | "warning" | "danger" | "info"
  icon?: React.ReactNode
}

export function StatusBadge({ className, variant = "info", icon, children, ...props }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold w-fit",
        {
          "bg-[var(--surface-subtle)] text-[var(--muted-foreground)]": variant === "draft" || variant === "archived",
          "bg-[var(--warning)]/10 text-[var(--warning)]": variant === "review" || variant === "warning",
          "bg-[var(--success)]/10 text-[var(--success)]": variant === "published" || variant === "success",
          "bg-[var(--danger)]/10 text-[var(--danger)]": variant === "danger",
          "bg-[var(--primary)]/10 text-[var(--primary)]": variant === "info",
        },
        className
      )}
      {...props}
    >
      {icon}
      {children}
    </span>
  )
}
