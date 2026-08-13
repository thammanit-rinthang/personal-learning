import { z } from "zod";

const optionalDateSchema = z.coerce.date().optional();

const sourceFieldsSchema = z.object({
  courseId: z.string().min(1).optional(),
  title: z.string().trim().min(1).max(500),
  sourceType: z.string().trim().min(1).max(100),
  publisher: z.string().trim().min(1).max(300),
  author: z.string().trim().min(1).max(300).optional(),
  url: z.url().optional(),
  citation: z.string().trim().min(1).max(2_000).optional(),
  publishedAt: optionalDateSchema,
  checkedAt: z.coerce.date(),
  jurisdiction: z.string().trim().min(1).max(100).optional(),
  effectiveFrom: optionalDateSchema,
  effectiveUntil: optionalDateSchema,
  notes: z.string().trim().min(1).max(5_000).optional(),
});

export const sourceCreateSchema = sourceFieldsSchema.refine((input) => !input.effectiveFrom || !input.effectiveUntil || input.effectiveFrom <= input.effectiveUntil, {
  message: "effectiveUntil must be on or after effectiveFrom",
  path: ["effectiveUntil"],
});

export const sourceUpdateSchema = sourceFieldsSchema.partial().omit({ courseId: true }).refine((input) => Object.keys(input).length > 0, {
  message: "At least one field must be provided",
});

export const attachConceptSchema = z.object({
  lessonId: z.string().min(1),
  conceptId: z.string().min(1),
});

export const attachSourceSchema = z.object({
  lessonId: z.string().min(1),
  sourceId: z.string().min(1),
});

export const attachSourceToQuestionSchema = z.object({
  questionId: z.string().min(1),
  sourceId: z.string().min(1),
});

export const sourceListInputSchema = z.object({
  courseId: z.string().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export type SourceCreate = z.infer<typeof sourceCreateSchema>;
export type SourceUpdate = z.infer<typeof sourceUpdateSchema>;
export type AttachConcept = z.infer<typeof attachConceptSchema>;
export type AttachSource = z.infer<typeof attachSourceSchema>;
export type AttachSourceToQuestion = z.infer<typeof attachSourceToQuestionSchema>;
export type SourceListInput = z.infer<typeof sourceListInputSchema>;
