import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export function ContinueLearning({
  item,
}: {
  item: {
    courseSlug: string;
    courseTitle: string;
    progress: { completedLessons: number; totalLessons: number; percent: number };
    lesson: { title: string; moduleTitle: string; href: string } | null;
  };
}) {
  const href = item.lesson?.href ?? `/courses/${item.courseSlug}`;

  return (
    <section className="border-y border-[var(--border)] bg-[var(--surface)] py-6 sm:rounded-xl sm:border sm:p-8">
      <p className="text-sm font-semibold text-[var(--primary)]">เรียนต่อ</p>
      <div className="mt-3 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-sm text-[var(--muted-foreground)]">{item.courseTitle}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{item.lesson?.title ?? "คุณเรียนจบรายวิชานี้แล้ว"}</h1>
          {item.lesson ? <p className="mt-2 text-[var(--muted-foreground)]">{item.lesson.moduleTitle}</p> : null}
          <div className="mt-6 flex max-w-xl items-center gap-3 text-sm">
            <Progress aria-label={`ความคืบหน้า ${item.progress.percent}%`} value={item.progress.percent} />
            <span className="shrink-0 font-medium">{item.progress.percent}%</span>
          </div>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">เรียนจบ {item.progress.completedLessons} จาก {item.progress.totalLessons} บท</p>
        </div>
        <Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[var(--primary)] px-4 text-sm font-semibold text-[var(--primary-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]" href={href}>
          {item.lesson ? "เรียนต่อ" : "ดูรายวิชา"}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </section>
  );
}
