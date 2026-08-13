import * as React from "react"
import { cn } from "@/lib/utils"

export interface DialogProps extends React.HTMLAttributes<HTMLDialogElement> {
  isOpen: boolean
  onClose: () => void
  title: string
}

export function Dialog({ className, isOpen, onClose, title, children, ...props }: DialogProps) {
  const dialogRef = React.useRef<HTMLDialogElement>(null)

  React.useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isOpen && !dialog.open) {
      dialog.showModal()
    } else if (!isOpen && dialog.open) {
      dialog.close()
    }
  }, [isOpen])

  React.useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    const handleCancel = (e: Event) => {
      e.preventDefault()
      onClose()
    }

    dialog.addEventListener("cancel", handleCancel)
    return () => dialog.removeEventListener("cancel", handleCancel)
  }, [onClose])

  return (
    <dialog
      ref={dialogRef}
      className={cn(
        "backdrop:bg-[var(--foreground)]/50 p-0 rounded-2xl shadow-xl border border-[var(--border)] bg-[var(--surface)] max-w-lg w-full fixed m-auto open:flex flex-col opacity-0 open:opacity-100 transition-opacity duration-200",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">{title}</h2>
        <button
          onClick={onClose}
          className="rounded-full p-1.5 hover:bg-[var(--surface-subtle)] text-[var(--muted-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Close dialog"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>
      <div className="p-6">{children}</div>
    </dialog>
  )
}
