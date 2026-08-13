import { enrollInCourseFormAction } from "@/app/actions/learning.actions";

type AvailableCourse = {
  id: string;
  title: string;
  description: string | null;
  subject: { title: string };
  _count: { modules: number };
  slug: string;
};

export function AvailableCourses({ courses }: { courses: AvailableCourse[] }) {
  if (!courses.length) return null;
  return <section aria-labelledby="available-courses-heading" className="mt-8 border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">Start here</p>
    <h2 id="available-courses-heading" className="mt-2 text-xl font-semibold">หลักสูตรที่พร้อมให้เริ่มเรียน</h2>
    <ul className="mt-5 grid gap-4 md:grid-cols-2">{courses.map((course) => <li key={course.id} className="border border-[var(--border)] p-4"><p className="text-xs text-[var(--muted-foreground)]">{course.subject.title} · {course._count.modules} Module</p><h3 className="mt-2 font-semibold">{course.title}</h3>{course.description ? <p className="mt-2 text-sm text-[var(--muted-foreground)]">{course.description}</p> : null}<form action={enrollInCourseFormAction.bind(null, course.id)} className="mt-4"><button className="min-h-11 rounded-md bg-[var(--primary)] px-4 text-sm font-semibold text-[var(--primary-foreground)]">ลงทะเบียนเรียน</button></form></li>)}</ul>
  </section>;
}
