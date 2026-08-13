import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CompleteLessonForm } from "@/components/learning/complete-lesson-form";
import { CourseOutline } from "@/components/learning/course-outline";
import { LessonRenderer } from "@/components/learning/lesson-renderer";
import { requireCurrentActor } from "@/server/auth";
import { getLearnerLesson } from "@/services/learner.service";

export default async function LessonPage({ params }: { params: Promise<{ courseSlug: string; moduleSlug: string; lessonSlug: string }> }) {
  const { courseSlug, moduleSlug, lessonSlug } = await params;
  const actor = await requireCurrentActor();
  const data = await getLearnerLesson(actor, courseSlug, moduleSlug, lessonSlug);
  const returnPath = `/learn/${courseSlug}/${moduleSlug}/${lessonSlug}`;
  const currentModule = data.outline.modules.find((item) => item.slug === moduleSlug);
  const currentLesson = currentModule?.lessons.find((item) => item.slug === lessonSlug);

  return <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
    <nav aria-label="Breadcrumb" className="text-sm text-[var(--muted-foreground)]"><Link href={`/courses/${courseSlug}`} className="underline">{data.outline.title}</Link><span aria-hidden="true"> / </span><span>{data.lesson.title}</span></nav>
    <div className="mt-6 grid gap-10 lg:grid-cols-[18rem_minmax(0,46rem)] lg:justify-center"><aside className="hidden lg:block"><CourseOutline course={data.outline} currentLessonSlug={lessonSlug} /></aside><article>
      <header className="border-b border-[var(--border)] pb-8"><p className="text-sm font-medium text-[var(--primary)]">{currentModule?.title}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">{data.lesson.title}</h1>{data.lesson.summary ? <p className="mt-3 text-[var(--muted-foreground)]">{data.lesson.summary}</p> : null}{data.lesson.durationMin ? <p className="mt-3 text-sm text-[var(--muted-foreground)]">ใช้เวลาประมาณ {data.lesson.durationMin} นาที</p> : null}</header>
      <div className="py-8"><LessonRenderer blocks={data.lesson.blocks} /></div>
      {data.lesson.concepts.length ? <section className="border-y border-[var(--border)] py-6"><h2 className="font-semibold">แนวคิดสำคัญ</h2><ul className="mt-3 flex flex-wrap gap-2">{data.lesson.concepts.map((concept) => <li key={concept.slug} className="rounded-full bg-[var(--surface-subtle)] px-3 py-1 text-sm">{concept.title}</li>)}</ul></section> : null}
      {data.lesson.assessments.length ? <section className="mt-8 border border-[var(--border)] bg-[var(--surface-subtle)] p-5"><h2 className="font-semibold">แบบประเมินหลังบทเรียน</h2><div className="mt-3 grid gap-3">{data.lesson.assessments.map((assessment) => <Link key={assessment.id} href={`/quiz/${assessment.id}`} className="flex min-h-11 items-center justify-between rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-medium hover:underline"><span>{assessment.title}{assessment.isRequired ? " · ต้องผ่าน" : " · เลือกทำได้"}</span><span className="text-[var(--muted-foreground)]">ผ่าน {assessment.passingScore}%</span></Link>)}</div></section> : null}
      <div className="mt-10 border-t border-[var(--border)] pt-6"><CompleteLessonForm lessonId={currentLesson?.id ?? ""} returnPath={returnPath} completed={data.lesson.status === "COMPLETED"} /></div>
      <nav aria-label="การนำทางบทเรียน" className="mt-8 grid gap-3 border-t border-[var(--border)] pt-6 sm:grid-cols-2">{data.previousLesson ? <Link className="flex min-h-11 items-center gap-2 rounded-md border border-[var(--border)] px-4 text-sm font-medium" href={`/learn/${courseSlug}/${data.previousLesson.moduleSlug}/${data.previousLesson.slug}`}><ChevronLeft aria-hidden="true" className="size-4" />ก่อนหน้า</Link> : <span />}{data.nextLesson ? <Link className="flex min-h-11 items-center justify-end gap-2 rounded-md border border-[var(--border)] px-4 text-right text-sm font-medium" href={`/learn/${courseSlug}/${data.nextLesson.moduleSlug}/${data.nextLesson.slug}`}>ถัดไป<ChevronRight aria-hidden="true" className="size-4" /></Link> : null}</nav>
    </article></div>
  </main>;
}
