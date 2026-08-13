import "server-only";
import { prisma } from "@/db/prisma";
import { type Actor } from "@/server/actor";
import { requirePermission } from "@/server/authorization";
import { AppError } from "@/server/errors";

export type ValidationResult = {
  valid: boolean;
  errors: Array<{ code: string; message: string; entityId?: string }>;
  warnings: Array<{ code: string; message: string; entityId?: string }>;
};

export async function validateLesson(actor: Actor, lessonId: string): Promise<ValidationResult> {
  requirePermission(actor, "lesson:read");

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { blocks: true },
  });

  if (!lesson) {
    throw new AppError("NOT_FOUND", "Lesson not found");
  }

  const errors: ValidationResult["errors"] = [];
  const warnings: ValidationResult["warnings"] = [];

  if (!lesson.objectives || lesson.objectives.length === 0) {
    errors.push({
      code: "missing_objectives",
      message: "Lesson must have at least one learning objective",
      entityId: lesson.id,
    });
  }

  if (lesson.blocks.length === 0) {
    warnings.push({
      code: "no_content",
      message: "Lesson has no content blocks",
      entityId: lesson.id,
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}


export async function validateCourse(actor: Actor, courseId: string): Promise<ValidationResult> {
  requirePermission(actor, "course:read");

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { modules: { include: { lessons: true } } },
  });

  if (!course) {
    throw new AppError("NOT_FOUND", "Course not found");
  }

  const errors: ValidationResult["errors"] = [];
  const warnings: ValidationResult["warnings"] = [];

  if (course.modules.length === 0) {
    errors.push({ code: "missing_modules", message: "Course must contain at least one module", entityId: course.id });
  }

  if (course.modules.every((module) => module.lessons.length === 0)) {
    warnings.push({ code: "missing_lessons", message: "Course has no lessons", entityId: course.id });
  }

  return { valid: errors.length === 0, errors, warnings };
}

export async function validateQuestionBank(actor: Actor): Promise<ValidationResult> {
  requirePermission(actor, "question:read");
  const invalidQuestions = await prisma.question.findMany({
    where: { OR: [{ prompt: "" }, { difficulty: { lt: 1 } }, { difficulty: { gt: 5 } }] },
    select: { id: true },
  });

  return {
    valid: invalidQuestions.length === 0,
    errors: invalidQuestions.map((question) => ({ code: "invalid_question", message: "Question is invalid", entityId: question.id })),
    warnings: [],
  };
}

export async function validateAssessment(actor: Actor, assessmentId: string): Promise<ValidationResult> {
  requirePermission(actor, "assessment:read");
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: { questions: true, sections: { include: { questions: true } } },
  });

  if (!assessment) {
    throw new AppError("NOT_FOUND", "Assessment not found");
  }

  const errors: ValidationResult["errors"] = [];
  if (assessment.passingScore < 0 || assessment.passingScore > 100) {
    errors.push({ code: "invalid_passing_score", message: "Passing score must be between 0 and 100", entityId: assessment.id });
  }
  if (assessment.questions.length === 0 && assessment.sections.every((section) => section.questions.length === 0)) {
    errors.push({ code: "missing_questions", message: "Assessment must include questions", entityId: assessment.id });
  }

  return { valid: errors.length === 0, errors, warnings: [] };
}
