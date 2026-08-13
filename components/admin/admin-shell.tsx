"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const groups = [
  {
    label: "เนื้อหา",
    items: [
      ["หลักสูตร", "/admin/courses"],
      ["คลังคำถาม", "/admin/questions"],
      ["แบบประเมิน", "/admin/assessments"],
    ],
  },
  {
    label: "คุณภาพ",
    items: [
      ["รายการตรวจทาน", "/admin/reviews"],
      ["แหล่งอ้างอิง", "/admin/sources"],
    ],
  },
  {
    label: "ระบบ",
    items: [
      ["MCP clients", "/admin/mcp-clients"],
      ["บันทึกการเปลี่ยนแปลง", "/admin/audit-logs"],
    ],
  },
] as const;

function AdminNavigation({ close }: { close?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="เมนูผู้ดูแล" className="space-y-7">
      <Link href="/admin" onClick={close} className="block rounded-md px-3 py-2 text-base font-semibold text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]">
        พื้นที่ทำงานผู้ดูแล
      </Link>
      {groups.map((group) => (
        <section key={group.label} aria-labelledby={`nav-${group.label}`}>
          <h2 id={`nav-${group.label}`} className="px-3 text-xs font-semibold text-[var(--muted-foreground)]">{group.label}</h2>
          <ul className="mt-2 space-y-1">
            {group.items.map(([label, href]) => {
              const active = pathname === href || (href === "/admin/courses" && pathname.startsWith("/admin/courses/"));
              return <li key={href}><Link href={href} onClick={close} aria-current={active ? "page" : undefined} className={`block rounded-md px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${active ? "bg-[var(--primary)] text-[var(--primary-foreground)]" : "text-[var(--foreground)] hover:bg-[var(--surface-subtle)]"}`}>{label}</Link></li>;
            })}
          </ul>
        </section>
      ))}
    </nav>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-[var(--background)] lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="hidden border-r border-[var(--border)] bg-[var(--surface)] p-4 lg:block"><AdminNavigation /></aside>
      <header className="flex min-h-16 items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-4 lg:hidden">
        <span className="font-semibold">พื้นที่ทำงานผู้ดูแล</span>
        <button type="button" aria-expanded={isOpen} aria-controls="admin-mobile-navigation" onClick={() => setIsOpen(true)} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-[var(--border)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"><Menu aria-hidden="true" className="size-5" /><span className="sr-only">เปิดเมนูผู้ดูแล</span></button>
      </header>
      {isOpen ? <div className="fixed inset-0 z-50 bg-black/35 lg:hidden" onClick={() => setIsOpen(false)}><aside id="admin-mobile-navigation" className="h-full w-[min(19rem,85vw)] overflow-y-auto bg-[var(--surface)] p-4 shadow-xl" onClick={(event) => event.stopPropagation()}><div className="mb-5 flex items-center justify-between"><span className="font-semibold">เมนูผู้ดูแล</span><button type="button" onClick={() => setIsOpen(false)} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"><X aria-hidden="true" className="size-5" /><span className="sr-only">ปิดเมนูผู้ดูแล</span></button></div><AdminNavigation close={() => setIsOpen(false)} /></aside></div> : null}
      <main className="min-w-0">{children}</main>
    </div>
  );
}
