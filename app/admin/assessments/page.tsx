import Link from "next/link";
import { getCurrentActor } from "@/server/auth";
import { listAssessmentTargets, listAssessments } from "@/services/admin-content.service";
import { AdminEmpty, AdminPageHeader, Status } from "@/components/admin/admin-ui";
import { AssessmentForm } from "@/components/admin/assessment-form";

export default async function AssessmentsPage() {
  const actor = await getCurrentActor();
  if (!actor) return null;
  const [assessments, courses] = await Promise.all([listAssessments(actor), listAssessmentTargets(actor)]);
  return <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8"><AdminPageHeader title="แบบประเมิน" description="กำหนดว่าจะให้ผู้เรียนสอบเมื่อจบบทเรียน, Module, Course หรือเริ่มเอง พร้อมกติกาคะแนนและจำนวนครั้ง" /><div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]"><section>{assessments.length ? <ul className="divide-y divide-[var(--border)] border-y border-[var(--border)]">{assessments.map((assessment) => <li key={assessment.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold"><Link href={`/admin/assessments/${assessment.id}`} className="hover:underline">{assessment.title}</Link></h2><p className="mt-1 text-sm text-[var(--muted-foreground)]">{assessment.type} · {assessment.trigger} · {assessment.isRequired ? "บังคับ" : "เลือกทำได้"} · ผ่าน {assessment.passingScore}% · {assessment._count.questions} คำถาม</p></div><Status value={assessment.status} /></li>)}</ul> : <AdminEmpty title="ยังไม่มีแบบประเมิน" description="สร้างแบบประเมินหลังจากมีคำถามในคลังเพียงพอ" />}</section><aside className="h-fit border border-[var(--border)] bg-[var(--surface)] p-5"><h2 className="text-lg font-semibold">สร้างแบบประเมิน</h2><div className="mt-5"><AssessmentForm courses={courses} /></div></aside></div></div>;
}
