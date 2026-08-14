import "server-only";

import { ContentStatus, QuestionType } from "@/app/generated/prisma/client";
import Decimal from "decimal.js";
import { prisma } from "@/db/prisma";
import { type Actor } from "@/server/actor";
import { requirePermission } from "@/server/authorization";
import { createAuditLog } from "@/server/audit";
import { AppError } from "@/server/errors";
import { createDraftRevision } from "@/services/content-governance.service";
import {
  createQuestionsBulkInputSchema,
  type CreateQuestionsBulkInput,
  multipleChoiceAnswerConfigSchema,
  multipleChoiceAnswerSchema,
  numericAnswerConfigSchema,
  numericAnswerSchema,
  singleChoiceAnswerConfigSchema,
  singleChoiceAnswerSchema,
  trueFalseAnswerConfigSchema,
  trueFalseAnswerSchema,
} from "@/schemas/question.schema";
import { questionBankListInputSchema, type QuestionBankListInput } from "@/schemas/admin.schema";
import { z } from "zod";

export type GradingQuestion = { type: QuestionType; answerConfig: unknown };
export type GradeResult = { isCorrect: boolean };

export function gradeAnswer(question: GradingQuestion, answer: unknown): GradeResult {
  try {
    switch (question.type) {
      case QuestionType.SINGLE_CHOICE: {
        const config = singleChoiceAnswerConfigSchema.parse(question.answerConfig);
        return { isCorrect: config.expectedChoiceId === singleChoiceAnswerSchema.parse(answer).choiceId };
      }
      case QuestionType.MULTIPLE_CHOICE: {
        const expected = [...multipleChoiceAnswerConfigSchema.parse(question.answerConfig).expectedChoiceIds].sort();
        const actual = [...multipleChoiceAnswerSchema.parse(answer).choiceIds].sort();
        return { isCorrect: expected.length === actual.length && expected.every((value, index) => value === actual[index]) };
      }
      case QuestionType.TRUE_FALSE:
        return { isCorrect: trueFalseAnswerConfigSchema.parse(question.answerConfig).expectedBoolean === trueFalseAnswerSchema.parse(answer).value };
      case QuestionType.NUMERIC: {
        const config = numericAnswerConfigSchema.parse(question.answerConfig);
        return { isCorrect: new Decimal(config.expected).minus(new Decimal(numericAnswerSchema.parse(answer).value)).abs().lessThanOrEqualTo(new Decimal(config.tolerance)) };
      }
    }
  } catch {
    return { isCorrect: false };
  }
}

export const updateQuestionInputSchema = z.object({
  prompt: z.string().min(1).optional(),
  explanation: z.string().nullable().optional(),
  hint: z.string().nullable().optional(),
  difficulty: z.number().int().min(1).max(5).optional(),
  answerConfig: z.unknown().optional(),
  choices: z.array(z.object({ text: z.string().min(1), isCorrect: z.boolean(), feedback: z.string().nullable().optional() })).optional(),
  conceptIds: z.array(z.string().min(1)).optional(),
}).refine((input) => Object.keys(input).length > 0, { message: "At least one field must be provided" });

export type UpdateQuestionInput = z.infer<typeof updateQuestionInputSchema>;

export async function createQuestionsBulk(actor: Actor, input: CreateQuestionsBulkInput) {
  requirePermission(actor, "question:write");
  const data = createQuestionsBulkInputSchema.parse(input);
  return prisma.$transaction(async (tx) => {
    const questions = [];
    for (const questionInput of data.questions) {
      const question = await tx.question.create({
        data: {
          type: questionInput.type,
          prompt: questionInput.prompt,
          explanation: questionInput.explanation,
          hint: questionInput.hint,
          difficulty: questionInput.difficulty,
          answerConfig: questionInput.answerConfig as import("@/app/generated/prisma/client").Prisma.InputJsonValue,
          status: ContentStatus.DRAFT,
          choices: questionInput.choices ? { create: questionInput.choices.map((choice, position) => ({ ...choice, position })) } : undefined,
          concepts: questionInput.conceptIds.length ? { connect: questionInput.conceptIds.map((id) => ({ id })) } : undefined,
        },
        include: { choices: true, concepts: true },
      });
      await createAuditLog({ actor, action: "CREATE_QUESTION", entityType: "QUESTION", entityId: question.id, after: question, db: tx });
      questions.push(question);
    }
    return questions;
  });
}

export async function listQuestions(actor: Actor, input: Partial<QuestionBankListInput> = {}) {
  requirePermission(actor, "question:read");
  if (actor.type === "USER" && actor.role === "LEARNER") {
    throw new AppError("FORBIDDEN", "Learners cannot access the question bank");
  }
  const data = questionBankListInputSchema.parse(input);
  const where = {
    status: data.status,
    type: data.type as QuestionType | undefined,
    ...(data.query ? { prompt: { contains: data.query, mode: "insensitive" as const } } : {}),
    ...(actor.type === "MCP" && !actor.permissions.includes("content:read_all") ? { status: ContentStatus.PUBLISHED } : {}),
  };
  const [items, total] = await prisma.$transaction([
    prisma.question.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (data.page - 1) * data.pageSize,
      take: data.pageSize,
      include: { choices: { orderBy: { position: "asc" } }, concepts: { select: { id: true, slug: true, title: true } } },
    }),
    prisma.question.count({ where }),
  ]);
  return { items, total, page: data.page, pageSize: data.pageSize };
}

export async function getQuestion(actor: Actor, questionId: string) {
  requirePermission(actor, "question:read");
  if (actor.type === "USER" && actor.role === "LEARNER") {
    throw new AppError("FORBIDDEN", "Learners cannot access questions outside an attempt");
  }
  const question = await prisma.question.findFirst({
    where: { id: questionId, ...(actor.type === "MCP" && !actor.permissions.includes("content:read_all") ? { status: ContentStatus.PUBLISHED } : {}) },
    include: { choices: { orderBy: { position: "asc" } }, concepts: true, sources: { include: { source: true } } },
  });
  if (!question) throw new AppError("NOT_FOUND", "Question not found");
  return question;
}

export async function updateQuestion(actor: Actor, questionId: string, input: UpdateQuestionInput) {
  requirePermission(actor, "question:write");
  const data = updateQuestionInputSchema.parse(input);
  const existing = await getQuestion(actor, questionId);
  if (existing.status === ContentStatus.PUBLISHED) {
    return createDraftRevision(actor, "QUESTION", questionId, { ...existing, ...data } as import("@/app/generated/prisma/client").Prisma.InputJsonValue, "Question edit proposed from published content");
  }
  if (actor.type === "MCP" && existing.status !== ContentStatus.DRAFT && !actor.permissions.includes("content:write_all")) throw new AppError("FORBIDDEN", "MCP may only update draft content");
  return prisma.$transaction(async (tx) => {
    const question = await tx.question.update({
      where: { id: questionId },
      data: {
        prompt: data.prompt,
        explanation: data.explanation,
        hint: data.hint,
        difficulty: data.difficulty,
        answerConfig: data.answerConfig as import("@/app/generated/prisma/client").Prisma.InputJsonValue | undefined,
        choices: data.choices ? { deleteMany: {}, create: data.choices.map((choice, position) => ({ ...choice, position })) } : undefined,
        concepts: data.conceptIds ? { set: data.conceptIds.map((id) => ({ id })) } : undefined,
      },
      include: { choices: true, concepts: true },
    });
    await createAuditLog({ actor, action: "UPDATE_QUESTION", entityType: "QUESTION", entityId: question.id, before: existing, after: question, db: tx });
    return question;
  });
}
