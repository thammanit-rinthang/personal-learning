import { notFound } from "next/navigation";
import { AssessmentForm } from "@/components/admin/assessment-form";
import { AdminPageHeader, Status } from "@/components/admin/admin-ui";
import { getCurrentActor } from "@/server/auth";
import { getAssessmentForAdmin, listAssessmentTargets } from "@/services/admin-content.service";

export default async function AssessmentDetailPage({ params }: { params: Promise<{ assessmentId: string }> }) {
  const actor = await getCurrentActor();
  if (!actor) return null;
  const { assessmentId } = await params;
  const [assessment, courses] = await Promise.all([getAssessmentForAdmin(actor, assessmentId), listAssessmentTargets(actor)]);
  if (!assessment) notFound();
  return <div className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8"><AdminPageHeader title={assessment.title} description="แก้ไขจุดเริ่มสอบและกติกาการทำแบบประเมิน" action={<Status value={assessment.status} />} /><div className="mt-8 border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-8"><AssessmentForm courses={courses} existing={assessment} /></div></div>;
}
