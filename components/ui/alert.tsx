import * as React from "react"
import { cn } from "@/lib/utils"

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "info" | "success" | "warning" | "error"
  icon?: React.ReactNode
}

export function Alert({ className, variant = "info", icon, children, ...props }: AlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 rounded-lg border p-4 text-sm",
        {
          "border-[var(--primary)]/20 bg-[var(--primary)]/5 text-[var(--foreground)]": variant === "info",
          "border-[var(--success)]/20 bg-[var(--success)]/5 text-[var(--foreground)]": variant === "success",
          "border-[var(--warning)]/20 bg-[var(--warning)]/5 text-[var(--foreground)]": variant === "warning",
          "border-[var(--danger)]/20 bg-[var(--danger)]/5 text-[var(--foreground)]": variant === "error",
        },
        className
      )}
      {...props}
    >
      {icon && (
        <div
          className={cn("mt-0.5 shrink-0", {
            "text-[var(--primary)]": variant === "info",
            "text-[var(--success)]": variant === "success",
            "text-[var(--warning)]": variant === "warning",
            "text-[var(--danger)]": variant === "error",
          })}
        >
          {icon}
        </div>
      )}
      <div className="flex-1">{children}</div>
    </div>
  )
}
