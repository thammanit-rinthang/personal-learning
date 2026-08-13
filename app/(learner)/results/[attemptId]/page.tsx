import { AssessmentResult } from "@/components/learning/assessment-result";
import { requireCurrentActor } from "@/server/auth";
import { getLearnerAssessmentResult } from "@/services/assessment.service";

export default async function ResultsPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  const actor = await requireCurrentActor();
  const result = await getLearnerAssessmentResult(actor, attemptId);
  return <AssessmentResult result={result} />;
}
