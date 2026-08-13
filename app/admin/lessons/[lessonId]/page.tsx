import { getCurrentActor } from "@/server/auth";
import { getLesson } from "@/services/lesson.service";
import { validateLesson } from "@/services/validation.service";
import { AdminPageHeader, Status, ValidationSummary } from "@/components/admin/admin-ui";
import { LessonEditor } from "@/components/admin/lesson-editor";

export default async function LessonDetailPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const actor = await getCurrentActor();
  if (!actor) return null;
  const lessonId = (await params).lessonId;
  const [lesson, validation] = await Promise.all([getLesson(actor, lessonId), validateLesson(actor, lessonId)]);
  return <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8"><AdminPageHeader title={lesson.title} description={`${lesson.module.course.title} / ${lesson.module.title} · v${lesson.version}`} action={<Status value={lesson.status} />} /><div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]"><section><h2 className="text-lg font-semibold">เนื้อหาและลำดับ block</h2><p className="mt-1 text-sm text-[var(--muted-foreground)]">ใช้ปุ่มขึ้นและลงเพื่อจัดลำดับด้วยแป้นพิมพ์ได้</p><div className="mt-5"><LessonEditor lesson={lesson} /></div></section><aside className="space-y-6"><ValidationSummary {...validation} /><section className="border border-[var(--border)] p-4"><h2 className="font-semibold">วัตถุประสงค์การเรียนรู้</h2><ul className="mt-3 list-disc space-y-2 pl-5 text-sm">{lesson.objectives.map((objective) => <li key={objective}>{objective}</li>)}</ul></section></aside></div></div>;
}
