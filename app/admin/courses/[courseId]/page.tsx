import { getCurrentActor } from "@/server/auth";
import { getCourse } from "@/services/course.service";
import { listSubjects } from "@/services/subject.service";
import { AdminPageHeader, Status } from "@/components/admin/admin-ui";
import { CourseForm } from "@/components/admin/course-form";
import { ModuleManager } from "@/components/admin/module-manager";
import { archiveCourseFormAction } from "@/app/actions/course.actions";

export default async function CourseDetailPage({ params }: { params: Promise<{ courseId: string }> }) {
  const actor = await getCurrentActor();
  if (!actor) return null;
  const courseId = (await params).courseId;
  const [course, subjects] = await Promise.all([getCourse(actor, courseId), listSubjects(actor)]);

  return <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
    <AdminPageHeader title={course.title} description={course.description ?? "ยังไม่มีคำอธิบายหลักสูตร"} action={<Status value={course.status} />} />
    <p className="mt-4 text-sm text-[var(--muted-foreground)]">เวอร์ชัน {course.version} · สาขา {course.subject.title}</p>
    <section className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div><h2 className="text-lg font-semibold">โครงสร้าง Module และบทเรียน</h2><div className="mt-4"><ModuleManager courseId={course.id} modules={course.modules} /></div></div>
      <aside className="h-fit border border-[var(--border)] bg-[var(--surface)] p-5"><h2 className="text-lg font-semibold">แก้ไขหลักสูตร</h2><div className="mt-5"><CourseForm course={{ id: course.id, title: course.title, slug: course.slug, description: course.description, subjectId: course.subject.id }} subjects={subjects} /></div><form action={archiveCourseFormAction.bind(null, course.id)} className="mt-6 border-t border-[var(--border)] pt-5"><button className="min-h-11 rounded-md border border-[var(--danger)] px-4 text-sm font-semibold text-[var(--danger)]">เก็บหลักสูตรถาวร</button></form></aside>
    </section>
  </div>;
}
