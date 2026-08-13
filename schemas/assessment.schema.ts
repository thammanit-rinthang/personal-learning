import { z } from "zod";
import { AssessmentTrigger, AssessmentType, FeedbackMode } from "@/app/generated/prisma/client";

export const createAssessmentInputSchema = z.object({
  courseId: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  type: z.nativeEnum(AssessmentType),
  feedbackMode: z.nativeEnum(FeedbackMode).default(FeedbackMode.AFTER_SUBMIT),
  passingScore: z.number().int().min(0).max(100).default(70),
  randomizeOrder: z.boolean().default(false),
  trigger: z.nativeEnum(AssessmentTrigger).default(AssessmentTrigger.MANUAL),
  isRequired: z.boolean().default(false),
  maxAttempts: z.number().int().min(1).nullable().optional(),
  triggerModuleId: z.string().min(1).nullable().optional(),
  triggerLessonId: z.string().min(1).nullable().optional(),
  sections: z.array(z.object({
    title: z.string().min(1),
    instructions: z.string().nullable().optional(),
    position: z.number().int(),
    questionCount: z.number().int().nullable().optional(),
    randomize: z.boolean().default(false),
  })).optional(),
}).superRefine((input, ctx) => {
  if (input.trigger === AssessmentTrigger.MODULE_COMPLETED && !input.triggerModuleId) {
    ctx.addIssue({ code: "custom", path: ["triggerModuleId"], message: "A module is required for module completion triggers" });
  }
  if (input.trigger === AssessmentTrigger.LESSON_COMPLETED && !input.triggerLessonId) {
    ctx.addIssue({ code: "custom", path: ["triggerLessonId"], message: "A lesson is required for lesson completion triggers" });
  }
  if (input.trigger !== AssessmentTrigger.MODULE_COMPLETED && input.triggerModuleId) {
    ctx.addIssue({ code: "custom", path: ["triggerModuleId"], message: "Module trigger target is only valid for module completion" });
  }
  if (input.trigger !== AssessmentTrigger.LESSON_COMPLETED && input.triggerLessonId) {
    ctx.addIssue({ code: "custom", path: ["triggerLessonId"], message: "Lesson trigger target is only valid for lesson completion" });
  }
});

export type CreateAssessmentInput = z.infer<typeof createAssessmentInputSchema>;

export const attachQuestionsToAssessmentInputSchema = z.object({
  assessmentId: z.string().min(1),
  questionIds: z.array(z.string().min(1)).min(1).max(500),
  sectionId: z.string().min(1).nullable().optional(),
  points: z.number().int().min(1).default(1),
}).superRefine((input, ctx) => {
  if (new Set(input.questionIds).size !== input.questionIds.length) {
    ctx.addIssue({ code: "custom", path: ["questionIds"], message: "Question IDs must be unique" });
  }
});

export type AttachQuestionsToAssessmentInput = z.infer<typeof attachQuestionsToAssessmentInputSchema>;
