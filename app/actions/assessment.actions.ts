"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentActor } from "@/server/auth";
import { AppError } from "@/server/errors";
import { createAssessment, startAssessmentAttempt, submitAssessmentAttempt, updateAssessment } from "@/services/assessment.service";
import { createAssessmentInputSchema } from "@/schemas/assessment.schema";
import { startAttemptInputSchema, submitAttemptInputSchema } from "@/schemas/attempt.schema";

export type AssessmentActionState = { error?: string; result?: { attemptId: string } };

export async function createAssessmentAction(formData: FormData) {
  try {
    const actor = await requireCurrentActor();
    const data = createAssessmentInputSchema.parse(JSON.parse(String(formData.get("data") ?? "{}")));
    const assessment = await createAssessment(actor, data);
    return { success: true, data: { id: assessment.id } };
  } catch (error) {
    return { success: false, error: error instanceof AppError ? error.message : "An unexpected error occurred" };
  }
}

export async function updateAssessmentAction(assessmentId: string, formData: FormData) {
  try {
    const actor = await requireCurrentActor();
    const data = createAssessmentInputSchema.parse(JSON.parse(String(formData.get("data") ?? "{}")));
    const assessment = await updateAssessment(actor, assessmentId, data);
    revalidatePath("/admin/assessments");
    return { success: true, data: { id: assessment.id } };
  } catch (error) {
    return { success: false, error: error instanceof AppError ? error.message : "An unexpected error occurred" };
  }
}

export async function startAssessmentAttemptAction(formData: FormData) {
  try {
    const actor = await requireCurrentActor();
    const input = startAttemptInputSchema.parse({ assessmentId: formData.get("assessmentId") });
    const attempt = await startAssessmentAttempt(actor, input);
    return { success: true, data: { id: attempt.id } };
  } catch (error) {
    return { success: false, error: error instanceof AppError ? error.message : "An unexpected error occurred" };
  }
}

export async function submitAssessmentAttemptAction(_: AssessmentActionState, formData: FormData): Promise<AssessmentActionState> {
  try {
    const actor = await requireCurrentActor();
    const input = submitAttemptInputSchema.parse(JSON.parse(String(formData.get("data") ?? "{}")));
    await submitAssessmentAttempt(actor, input);
    revalidatePath(`/results/${input.attemptId}`);
    revalidatePath("/progress");
    revalidatePath("/review/mistakes");
    return { result: { attemptId: input.attemptId } };
  } catch (error) {
    return { error: error instanceof AppError ? error.message : "ไม่สามารถส่งคำตอบได้" };
  }
}
