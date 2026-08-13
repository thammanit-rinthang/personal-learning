import { z } from "zod";
import { QuestionType } from "@/app/generated/prisma/client";

export const singleChoiceAnswerConfigSchema = z.object({
  expectedChoiceId: z.string().min(1),
});

export const multipleChoiceAnswerConfigSchema = z.object({
  expectedChoiceIds: z.array(z.string().min(1)),
});

export const trueFalseAnswerConfigSchema = z.object({
  expectedBoolean: z.boolean(),
});

export const numericAnswerConfigSchema = z.object({
  expected: z.string().regex(/^-?\d+(\.\d+)?$/),
  tolerance: z.string().regex(/^\d+(\.\d+)?$/),
});

export const questionAnswerConfigSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal(QuestionType.SINGLE_CHOICE), answerConfig: singleChoiceAnswerConfigSchema }),
  z.object({ type: z.literal(QuestionType.MULTIPLE_CHOICE), answerConfig: multipleChoiceAnswerConfigSchema }),
  z.object({ type: z.literal(QuestionType.TRUE_FALSE), answerConfig: trueFalseAnswerConfigSchema }),
  z.object({ type: z.literal(QuestionType.NUMERIC), answerConfig: numericAnswerConfigSchema }),
]);

export const questionChoiceSchema = z.object({
  text: z.string().min(1),
  isCorrect: z.boolean().default(false),
  feedback: z.string().nullable().optional(),
});

export const createQuestionInputSchema = z.object({
  type: z.nativeEnum(QuestionType),
  prompt: z.string().min(1),
  explanation: z.string().nullable().optional(),
  hint: z.string().nullable().optional(),
  difficulty: z.number().int().min(1).max(5).default(1),
  answerConfig: z.unknown(),
  choices: z.array(questionChoiceSchema).optional(),
  conceptIds: z.array(z.string()).default([]),
});

export const createQuestionsBulkInputSchema = z.object({
  questions: z.array(createQuestionInputSchema),
});

export type CreateQuestionInput = z.infer<typeof createQuestionInputSchema>;
export type CreateQuestionsBulkInput = z.infer<typeof createQuestionsBulkInputSchema>;

export const singleChoiceAnswerSchema = z.object({ choiceId: z.string() });
export const multipleChoiceAnswerSchema = z.object({ choiceIds: z.array(z.string()) });
export const trueFalseAnswerSchema = z.object({ value: z.boolean() });
export const numericAnswerSchema = z.object({ value: z.string().regex(/^-?\d+(\.\d+)?$/) });
