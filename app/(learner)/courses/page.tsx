import Link from "next/link";
import { BookOpen } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { getCurrentActor } from "@/server/auth";
import { getLearnerDashboard, listLearnerCourseCatalog } from "@/services/learner.service";
import { enrollInCourseFormAction } from "@/app/actions/learning.actions";

export default async function CoursesPage({ searchParams }: { searchParams: Promise<{ enrolled?: string }> }) {
  const actor = await getCurrentActor();
  if (!actor) return null;
  const [dashboard, catalog] = await Promise.all([getLearnerDashboard(actor), listLearnerCourseCatalog(actor)]);
  const enrolled = (await searchParams).enrolled === "1";

  return <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
    <header className="border-b border-[var(--border)] pb-6"><p className="text-sm font-medium text-[var(--primary)]">Learning library</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">หลักสูตร</h1><p className="mt-3 max-w-2xl text-[var(--muted-foreground)]">เลือกหลักสูตรที่เผยแพร่แล้วเพื่อเริ่มเรียน และดูความคืบหน้าของหลักสูตรที่ลงทะเบียนไว้</p></header>
    {enrolled ? <p role="status" className="mt-6 border border-[var(--success)]/30 bg-[var(--success)]/10 p-3 text-sm">ลงทะเบียนหลักสูตรแล้ว</p> : null}
    {catalog.length ? <ul className="mt-8 grid gap-4 md:grid-cols-2">{catalog.map((course) => <li key={course.id} className="border border-[var(--border)] bg-[var(--surface)] p-5 hover:border-[var(--primary)]"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">{course.subject.title}</p><h2 className="mt-2 text-xl font-semibold">{course.title}</h2></div><span className="text-xs text-[var(--muted-foreground)]">{course._count.modules} Module</span></div>{course.description ? <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">{course.description}</p> : null}{course.enrolled ? <div className="mt-5 flex items-center justify-between gap-3"><span className="text-sm font-medium text-[var(--success)]">ลงทะเบียนแล้ว</span><Link href={`/courses/${course.slug}`} className="inline-flex min-h-11 items-center rounded-md bg-[var(--primary)] px-4 text-sm font-semibold text-[var(--primary-foreground)]">เริ่มเรียน</Link></div> : <form action={enrollInCourseFormAction.bind(null, course.id)} className="mt-5"><button className="min-h-11 rounded-md border border-[var(--primary)] px-4 text-sm font-semibold text-[var(--primary)]">ลงทะเบียนเรียน</button></form>}</li>)}</ul> : <div className="mt-10"><EmptyState icon={<BookOpen />} title="ยังไม่มีหลักสูตรที่เผยแพร่" description="เมื่อมีหลักสูตรเผยแพร่แล้ว หลักสูตรจะปรากฏที่หน้านี้" /></div>}
    {dashboard.courses.length === 0 && catalog.length > 0 ? <p className="mt-8 text-sm text-[var(--muted-foreground)]">คุณยังไม่ได้ลงทะเบียนหลักสูตรใด เลือกหลักสูตรด้านบนเพื่อเริ่มเรียน</p> : null}
  </main>;
}
