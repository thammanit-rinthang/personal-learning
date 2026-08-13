import { redirect } from "next/navigation";
import { QuestionRunner } from "@/components/learning/question-runner";
import { requireCurrentActor } from "@/server/auth";
import { getLearnerAttempt, startAssessmentAttempt } from "@/services/assessment.service";

export default async function QuizPage({ params, searchParams }: { params: Promise<{ assessmentId: string }>; searchParams: Promise<{ attempt?: string }> }) {
  const [{ assessmentId }, { attempt: attemptId }] = await Promise.all([params, searchParams]);
  const actor = await requireCurrentActor();
  if (!attemptId) {
    const attempt = await startAssessmentAttempt(actor, { assessmentId });
    redirect(`/quiz/${assessmentId}?attempt=${attempt.id}`);
  }
  const attempt = await getLearnerAttempt(actor, attemptId);
  if (attempt.isSubmitted) redirect(`/results/${attempt.id}`);
  return <QuestionRunner attempt={attempt} />;
}
