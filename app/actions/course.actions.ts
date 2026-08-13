"use server";

import { requireCurrentActor } from "@/server/auth";
import { createCourseDraft, updateCourse, reorderModules, createModule, updateModule, archiveCourse } from "@/services/course.service";
import { courseCreateSchema, courseUpdateSchema } from "@/schemas/course.schema";
import { AppError } from "@/server/errors";

export async function createCourseDraftAction(formData: FormData) {
  try {
    const actor = await requireCurrentActor();
    const data = courseCreateSchema.parse(Object.fromEntries(formData.entries()));
    const course = await createCourseDraft(actor, data);
    return { success: true, data: { id: course.id } };
  } catch (error) {
    if (error instanceof AppError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function updateCourseAction(courseId: string, formData: FormData) {
  try {
    const actor = await requireCurrentActor();
    const data = courseUpdateSchema.parse(Object.fromEntries(formData.entries()));
    const course = await updateCourse(actor, courseId, data);
    return { success: true, data: { id: course.id } };
  } catch (error) {
    if (error instanceof AppError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function reorderModulesAction(courseId: string, formData: FormData) {
  try {
    const actor = await requireCurrentActor();
    const moduleIds = formData.getAll("moduleIds") as string[];
    await reorderModules(actor, courseId, moduleIds);
    return { success: true };
  } catch (error) {
    if (error instanceof AppError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function createModuleAction(formData: FormData) {
  try {
    const actor = await requireCurrentActor();
    const createdModule = await createModule(actor, {
      courseId: String(formData.get("courseId") ?? ""), slug: String(formData.get("slug") ?? ""),
      title: String(formData.get("title") ?? ""), description: String(formData.get("description") ?? "") || undefined,
      position: Number(formData.get("position") ?? 0),
    });
    return { success: true, data: { id: createdModule.id } };
  } catch (error) {
    if (error instanceof AppError) return { success: false, error: error.message };
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function archiveCourseAction(courseId: string) {
  try {
    const actor = await requireCurrentActor();
    await archiveCourse(actor, courseId);
    return { success: true };
  } catch (error) {
    if (error instanceof AppError) return { success: false, error: error.message };
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function archiveCourseFormAction(courseId: string, _formData: FormData): Promise<void> {
  void _formData;
  await archiveCourseAction(courseId);
}

export async function updateModuleAction(moduleId: string, formData: FormData) {
  try {
    const actor = await requireCurrentActor();
    const updatedModule = await updateModule(actor, moduleId, { title: String(formData.get("title") ?? ""), description: String(formData.get("description") ?? "") });
    return { success: true, data: { id: updatedModule.id } };
  } catch (error) {
    if (error instanceof AppError) return { success: false, error: error.message };
    return { success: false, error: "An unexpected error occurred" };
  }
}
