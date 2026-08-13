import Link from "next/link";
import { getCurrentActor } from "@/server/auth";
import { listCourses } from "@/services/course.service";
import { listSubjects } from "@/services/subject.service";
import { AdminEmpty, AdminPageHeader, Status } from "@/components/admin/admin-ui";
import { CourseForm } from "@/components/admin/course-form";

export default async function CoursesPage() {
  const actor = await getCurrentActor();
  if (!actor) return null;
  const [courses, subjects] = await Promise.all([listCourses(actor), listSubjects(actor)]);
  return <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8"><AdminPageHeader title="หลักสูตร" description="สร้างและจัดการโครงสร้างหลักสูตร ฉบับเผยแพร่จะไม่ถูกเขียนทับโดยตรง" /><div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]"><section>{courses.length ? <ul className="divide-y divide-[var(--border)] border-y border-[var(--border)]">{courses.map((course) => <li key={course.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"><div><Link href={`/admin/courses/${course.id}`} className="font-semibold hover:underline">{course.title}</Link><p className="mt-1 text-sm text-[var(--muted-foreground)]">v{course.version} · {course.slug}</p></div><Status value={course.status} /></li>)}</ul> : <AdminEmpty title="ยังไม่มีหลักสูตร" description="เริ่มด้วยการสร้างหลักสูตรฉบับร่าง" />}</section><aside className="border border-[var(--border)] bg-[var(--surface)] p-5"><h2 className="text-lg font-semibold">สร้างหลักสูตร</h2><div className="mt-5">{subjects.length ? <CourseForm subjects={subjects} /> : <p className="text-sm text-[var(--muted-foreground)]">ยังไม่มีสาขาวิชาให้เลือก</p>}</div></aside></div></div>;
}
