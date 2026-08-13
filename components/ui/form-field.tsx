import * as React from "react"
import { cn } from "@/lib/utils"

export interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  helpText?: string
}

const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  ({ className, label, error, helpText, id, ...props }, ref) => {
    const defaultId = React.useId()
    const inputId = id || defaultId
    const errorId = `${inputId}-error`
    const helpId = `${inputId}-help`

    return (
      <div className={cn("flex flex-col gap-1.5", className)}>
        <label htmlFor={inputId} className="text-sm font-medium text-[var(--foreground)]">
          {label}
        </label>
        <input
          id={inputId}
          ref={ref}
          className={cn(
            "flex h-11 sm:h-10 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-[var(--danger)] focus-visible:ring-[var(--danger)]"
          )}
          aria-invalid={!!error}
          aria-describedby={
            error ? errorId : helpText ? helpId : undefined
          }
          {...props}
        />
        {error ? (
          <p id={errorId} className="text-sm text-[var(--danger)]">
            {error}
          </p>
        ) : helpText ? (
          <p id={helpId} className="text-sm text-[var(--muted-foreground)]">
            {helpText}
          </p>
        ) : null}
      </div>
    )
  }
)
FormField.displayName = "FormField"

export { FormField }
