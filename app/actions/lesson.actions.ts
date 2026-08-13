"use server";

import { requireCurrentActor } from "@/server/auth";
import { createLessonDraft, upsertLessonBlocks, reorderLessons } from "@/services/lesson.service";
import { lessonCreateSchema, upsertLessonBlocksSchema } from "@/schemas/lesson.schema";
import { AppError } from "@/server/errors";

export async function createLessonDraftAction(formData: FormData) {
  try {
    const actor = await requireCurrentActor();
    const data = lessonCreateSchema.parse({
      moduleId: formData.get("moduleId"),
      slug: formData.get("slug"),
      title: formData.get("title"),
      summary: formData.get("summary") || undefined,
      objectives: formData.getAll("objectives"),
      position: Number(formData.get("position")),
      durationMin: formData.has("durationMin") ? Number(formData.get("durationMin")) : undefined,
    });
    
    const lesson = await createLessonDraft(actor, data);
    return { success: true, data: { id: lesson.id } };
  } catch (error) {
    if (error instanceof AppError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function upsertLessonBlocksAction(lessonId: string, formData: FormData) {
  try {
    const actor = await requireCurrentActor();
    const blocksJson = formData.get("blocks") as string;
    const blocks = blocksJson ? JSON.parse(blocksJson) : [];
    
    const data = upsertLessonBlocksSchema.parse({ blocks });
    const result = await upsertLessonBlocks(actor, lessonId, data);
    
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof AppError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function reorderLessonsAction(moduleId: string, formData: FormData) {
  try {
    const actor = await requireCurrentActor();
    await reorderLessons(actor, moduleId, formData.getAll("lessonIds") as string[]);
    return { success: true };
  } catch (error) {
    if (error instanceof AppError) return { success: false, error: error.message };
    return { success: false, error: "An unexpected error occurred" };
  }
}
