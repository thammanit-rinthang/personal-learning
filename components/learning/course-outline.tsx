import Link from "next/link";
import { CheckCircle2, Circle, LockKeyhole } from "lucide-react";
import { LessonProgressStatus } from "@/app/generated/prisma/enums";
import type { LearnerCourseOutline } from "@/services/learner.service";
import { Progress } from "@/components/ui/progress";

function lessonStatus(status: LessonProgressStatus) {
  if (status === LessonProgressStatus.COMPLETED) {
    return { label: "เรียนจบแล้ว", Icon: CheckCircle2 };
  }

  if (status === LessonProgressStatus.IN_PROGRESS) {
    return { label: "กำลังเรียน", Icon: Circle };
  }

  return { label: "ยังไม่เริ่ม", Icon: Circle };
}

export function CourseOutline({ course, currentLessonSlug }: { course: LearnerCourseOutline; currentLessonSlug?: string }) {
  return (
    <section aria-label="โครงสร้างรายวิชา" className="rounded-xl border border-[var(--border)] bg-[var(--surface)]">
      <div className="border-b border-[var(--border)] p-5">
        <p className="text-sm text-[var(--muted-foreground)]">{course.subjectTitle}</p>
        <h2 className="mt-1 text-lg font-semibold">{course.title}</h2>
        <div className="mt-4 flex items-center gap-3 text-sm">
          <Progress aria-label={`ความคืบหน้า ${course.progress.percent}%`} value={course.progress.percent} />
          <span className="shrink-0 font-medium">{course.progress.percent}%</span>
        </div>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">เรียนจบ {course.progress.completedLessons} จาก {course.progress.totalLessons} บท</p>
      </div>
      <ol className="divide-y divide-[var(--border)]">
        {course.modules.map((module) => (
          <li key={module.id} className="p-5">
            <h3 className="text-sm font-semibold">{module.position + 1}. {module.title}</h3>
            {module.description ? <p className="mt-1 text-sm text-[var(--muted-foreground)]">{module.description}</p> : null}
            <ol className="mt-3 space-y-1">
              {module.lessons.map((lesson) => {
                const { label, Icon } = lessonStatus(lesson.status);
                const href = `/learn/${course.slug}/${module.slug}/${lesson.slug}`;
                const current = currentLessonSlug === lesson.slug;

                return (
                  <li key={lesson.id}>
                    <Link
                      aria-current={current ? "page" : undefined}
                      className={`flex min-h-11 items-center gap-3 rounded-lg px-2 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${current ? "bg-[var(--surface-subtle)] font-semibold" : "hover:bg-[var(--surface-subtle)]"}`}
                      href={href}
                    >
                      <Icon aria-hidden="true" className="size-4 shrink-0 text-[var(--muted-foreground)]" />
                      <span className="min-w-0 flex-1">{lesson.title}</span>
                      <span className="shrink-0 text-xs text-[var(--muted-foreground)]">{label}{lesson.durationMin ? ` · ${lesson.durationMin} นาที` : ""}</span>
                    </Link>
                  </li>
                );
              })}
              {module.lessons.length === 0 ? (
                <li className="flex items-center gap-2 px-2 py-2 text-sm text-[var(--muted-foreground)]"><LockKeyhole className="size-4" aria-hidden="true" />ยังไม่มีบทเรียนที่เปิดให้เรียน</li>
              ) : null}
            </ol>
          </li>
        ))}
      </ol>
    </section>
  );
}
