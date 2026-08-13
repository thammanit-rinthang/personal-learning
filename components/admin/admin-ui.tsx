import Link from "next/link";
import { CheckCircle2, CircleAlert, Clock3, FileQuestion, FolderOpen, ShieldCheck } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";

export function AdminPageHeader({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return <header className="flex flex-col gap-4 border-b border-[var(--border)] pb-6 sm:flex-row sm:items-start sm:justify-between"><div><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">{description}</p></div>{action}</header>;
}

export function Status({ value }: { value: string }) {
  const labels: Record<string, string> = { DRAFT: "ฉบับร่าง", IN_REVIEW: "รอตรวจทาน", PUBLISHED: "เผยแพร่แล้ว", ARCHIVED: "เก็บถาวรแล้ว" };
  const variant = value === "PUBLISHED" ? "published" : value === "IN_REVIEW" ? "review" : value === "ARCHIVED" ? "archived" : "draft";
  return <StatusBadge variant={variant}>{labels[value] ?? value}</StatusBadge>;
}

export function AdminEmpty({ title, description, href, actionLabel, type = "content" }: { title: string; description: string; href?: string; actionLabel?: string; type?: "content" | "question" | "review" }) {
  const Icon = type === "question" ? FileQuestion : type === "review" ? ShieldCheck : FolderOpen;
  return <EmptyState icon={<Icon aria-hidden="true" className="size-6" />} title={title} description={description} action={href && actionLabel ? <Link href={href} className="inline-flex min-h-11 items-center rounded-md bg-[var(--primary)] px-4 text-sm font-semibold text-[var(--primary-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]">{actionLabel}</Link> : undefined} />;
}

export function ValidationSummary({ valid, errors, warnings }: { valid: boolean; errors: Array<{ code: string; message: string }>; warnings: Array<{ code: string; message: string }> }) {
  if (valid && warnings.length === 0) return <div className="flex items-center gap-2 rounded-lg border border-[var(--success)]/30 bg-[var(--success)]/10 p-4 text-sm"><CheckCircle2 aria-hidden="true" className="size-5 text-[var(--success)]" />ตรวจสอบแล้ว ไม่พบข้อผิดพลาดที่ขัดขวางการเผยแพร่</div>;
  return <section aria-label="ผลการตรวจสอบ" className="rounded-lg border border-[var(--border)]"><div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-3 font-semibold"><CircleAlert aria-hidden="true" className="size-5 text-[var(--warning)]" />ผลการตรวจสอบ</div><ul className="space-y-2 p-4 text-sm">{errors.map((item) => <li key={item.code} className="flex gap-2 text-[var(--danger)]"><CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />{item.message}</li>)}{warnings.map((item) => <li key={item.code} className="flex gap-2 text-[var(--warning)]"><Clock3 aria-hidden="true" className="mt-0.5 size-4 shrink-0" />{item.message}</li>)}</ul></section>;
}
