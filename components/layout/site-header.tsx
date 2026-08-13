import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { logoutAction } from "@/app/actions/auth.actions"
import { getCurrentActor } from "@/server/auth"

export async function SiteHeader({ className }: React.HTMLAttributes<HTMLElement>) {
  const actor = await getCurrentActor()
  return (
    <header className={cn("sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-sm", className)}>
      <div className="container flex min-h-16 flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2 md:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] rounded-md px-2 min-h-[44px] sm:min-h-[auto]">
          <span>Personal Learning OS</span>
        </Link>
        {actor ? <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
          <nav aria-label="เมนูผู้เรียน" className="flex min-w-0 items-center gap-1 overflow-x-auto">
            <Link href="/courses" className="whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium hover:bg-[var(--surface-subtle)]">หลักสูตร</Link>
            <Link href="/progress" className="whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium hover:bg-[var(--surface-subtle)]">ความคืบหน้า</Link>
            <Link href="/review/mistakes" className="whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium hover:bg-[var(--surface-subtle)]">ทบทวนข้อผิดพลาด</Link>
            {actor.role !== "LEARNER" ? <Link href="/admin" className="whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium hover:bg-[var(--surface-subtle)]">ผู้ดูแลระบบ</Link> : null}
          </nav>
          <form action={logoutAction} className="shrink-0"><button className="min-h-11 rounded-md px-3 text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--surface-subtle)]">ออกจากระบบ</button></form>
        </div> : <nav aria-label="เมนูสาธารณะ" className="ml-auto flex items-center gap-1"><Link href="/login" className="rounded-md px-3 py-2 text-sm font-medium">เข้าสู่ระบบ</Link><Link href="/register" className="rounded-md bg-[var(--primary)] px-3 py-2 text-sm font-semibold text-[var(--primary-foreground)]">สร้างบัญชี</Link></nav>}
      </div>
    </header>
  )
}
