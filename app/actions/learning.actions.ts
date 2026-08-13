"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCurrentActor } from "@/server/auth";
import { AppError } from "@/server/errors";
import { enrollInCourse, markLessonComplete } from "@/services/learner.service";

export type LearningActionState = { error?: string; success?: string };

export async function markLessonCompleteAction(_: LearningActionState, formData: FormData): Promise<LearningActionState> {
  try {
    const actor = await requireCurrentActor();
    const lessonId = String(formData.get("lessonId") ?? "");
    const returnPath = String(formData.get("returnPath") ?? "/");
    await markLessonComplete(actor, lessonId);
    revalidatePath(returnPath);
    return { success: "บันทึกบทเรียนว่าเรียนจบแล้ว" };
  } catch (error) {
    return { error: error instanceof AppError ? error.message : "ไม่สามารถบันทึกความคืบหน้าได้" };
  }
}

export async function enrollInCourseFormAction(courseId: string, _formData: FormData): Promise<void> {
  void _formData;
  const actor = await requireCurrentActor();
  await enrollInCourse(actor, courseId);
  revalidatePath("/");
  revalidatePath("/courses");
  redirect("/courses?enrolled=1");
}
