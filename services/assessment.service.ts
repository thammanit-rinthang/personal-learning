import "server-only";

import crypto from "node:crypto";
import { AssessmentTrigger, ContentStatus } from "@/app/generated/prisma/enums";
import type { Prisma, QuestionType } from "@/app/generated/prisma/client";
import { prisma } from "@/db/prisma";
import type { TransactionClient } from "@/db/transaction";
import { createAuditLog } from "@/server/audit";
import type { Actor } from "@/server/actor";
import { requirePermission } from "@/server/authorization";
import { AppError } from "@/server/errors";
import { attachQuestionsToAssessmentInputSchema, type AttachQuestionsToAssessmentInput, type CreateAssessmentInput } from "@/schemas/assessment.schema";
import { startAttemptInputSchema, submitAttemptInputSchema, type StartAttemptInput, type SubmitAttemptInput } from "@/schemas/attempt.schema";
import { calculateMastery } from "@/services/mastery.service";
import { gradeAnswer } from "@/services/question.service";

export type AssessmentResult = {
  score: number;
  percentage: number;
  passed: boolean;
};

export type LearnerAttempt = {
  id: string;
  assessment: { id: string; title: string; description: string | null; feedbackMode: string; passingScore: number };
  isSubmitted: boolean;
  questions: Array<{
    id: string;
    position: number;
    type: QuestionType;
    prompt: string;
    choices: Array<{ id: string; position: number; text: string }>;
    points: number;
  }>;
};

export type LearnerAssessmentResult = AssessmentResult & {
  attemptId: string;
  assessmentTitle: string;
  submittedAt: Date;
  questions: Array<{
    id: string;
    position: number;
    prompt: string;
    points: number;
    pointsAwarded: number;
    isCorrect: boolean;
    answer: Prisma.JsonValue;
  }>;
};

function requireLearner(actor: Actor) {
  requirePermission(actor, "assessment:read");
  if (actor.type !== "USER" || !actor.id) {
    throw new AppError("FORBIDDEN", "Learner access is required");
  }
}

function seededShuffle<T>(items: T[], seed: string): T[] {
  const shuffled = [...items];
  const hash = crypto.createHash("sha256").update(seed).digest();
  let hashIndex = 0;

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = hash.readUInt32BE(hashIndex % (hash.length - 3)) % (index + 1);
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
    hashIndex += 4;
  }

  return shuffled;
}

async function validateTriggerTarget(tx: TransactionClient, input: CreateAssessmentInput) {
  if (input.trigger === AssessmentTrigger.MODULE_COMPLETED) {
    const targetModule = await tx.module.findFirst({ where: { id: input.triggerModuleId ?? "", courseId: input.courseId }, select: { id: true } });
    if (!targetModule) throw new AppError("VALIDATION", "The selected module must belong to the assessment course");
  }
  if (input.trigger === AssessmentTrigger.LESSON_COMPLETED) {
    const lesson = await tx.lesson.findFirst({ where: { id: input.triggerLessonId ?? "", module: { courseId: input.courseId } }, select: { id: true } });
    if (!lesson) throw new AppError("VALIDATION", "The selected lesson must belong to the assessment course");
  }
}

function toLearnerAttempt(attempt: {
  id: string;
  isSubmitted: boolean;
  assessment: { id: string; title: string; description: string | null; feedbackMode: string; passingScore: number };
  questions: Array<{ id: string; position: number; questionType: QuestionType; promptSnapshot: string; choicesSnapshot: Prisma.JsonValue | null; points: number }>;
}): LearnerAttempt {
  return {
    id: attempt.id,
    assessment: attempt.assessment,
    isSubmitted: attempt.isSubmitted,
    questions: attempt.questions.map((question) => ({
      id: question.id,
      position: question.position,
      type: question.questionType,
      prompt: question.promptSnapshot,
      choices: Array.isArray(question.choicesSnapshot)
        ? question.choicesSnapshot.map((choice) => {
            const value = choice as { id: string; position: number; text: string };
            return { id: value.id, position: value.position, text: value.text };
          })
        : [],
      points: question.points,
    })),
  };
}

export async function createAssessment(actor: Actor, input: CreateAssessmentInput) {
  requirePermission(actor, "assessment:write");

  return prisma.$transaction(async (tx) => {
    await validateTriggerTarget(tx, input);
    const assessment = await tx.assessment.create({
      data: {
        courseId: input.courseId,
        slug: input.slug,
        title: input.title,
        description: input.description,
        type: input.type,
        feedbackMode: input.feedbackMode,
        passingScore: input.passingScore,
        randomizeOrder: input.randomizeOrder,
        trigger: input.trigger,
        isRequired: input.isRequired,
        maxAttempts: input.maxAttempts ?? null,
        triggerModuleId: input.triggerModuleId ?? null,
        triggerLessonId: input.triggerLessonId ?? null,
        sections: input.sections ? { create: input.sections.map((section) => ({ ...section })) } : undefined,
      },
      include: { sections: true },
    });
    await createAuditLog({ actor, action: "CREATE", entityType: "ASSESSMENT", entityId: assessment.id, after: assessment, db: tx });
    return assessment;
  });
}

export async function attachQuestionsToAssessment(actor: Actor, input: AttachQuestionsToAssessmentInput) {
  requirePermission(actor, "assessment:write");
  const data = attachQuestionsToAssessmentInputSchema.parse(input);

  return prisma.$transaction(async (tx) => {
    const assessment = await tx.assessment.findUnique({
      where: { id: data.assessmentId },
      select: { id: true, status: true, title: true },
    });
    if (!assessment) throw new AppError("NOT_FOUND", "Assessment not found");
    if (actor.type === "MCP" && assessment.status !== ContentStatus.DRAFT && !actor.permissions.includes("content:write_all")) {
      throw new AppError("FORBIDDEN", "MCP may only attach questions to draft assessments");
    }

    if (data.sectionId) {
      const section = await tx.assessmentSection.findFirst({
        where: { id: data.sectionId, assessmentId: data.assessmentId },
        select: { id: true },
      });
      if (!section) throw new AppError("VALIDATION", "Section does not belong to the assessment");
    }

    const questions = await tx.question.findMany({
      where: { id: { in: data.questionIds } },
      select: { id: true, status: true },
    });
    const foundQuestionIds = new Set(questions.map((question) => question.id));
    const missingQuestionIds = data.questionIds.filter((questionId) => !foundQuestionIds.has(questionId));
    if (missingQuestionIds.length > 0) {
      throw new AppError("NOT_FOUND", "One or more questions were not found", { details: { questionIds: missingQuestionIds } });
    }
    if (actor.type === "MCP" && questions.some((question) => question.status !== ContentStatus.DRAFT) && !actor.permissions.includes("content:write_all")) {
      throw new AppError("FORBIDDEN", "MCP may only attach draft questions");
    }

    const existing = await tx.assessmentQuestion.findMany({
      where: { assessmentId: data.assessmentId, questionId: { in: data.questionIds } },
      select: { questionId: true, position: true, assessmentSectionId: true, points: true },
    });
    const existingIds = new Set(existing.map((item) => item.questionId));
    const questionIdsToAttach = data.questionIds.filter((questionId) => !existingIds.has(questionId));
    const maxPosition = await tx.assessmentQuestion.aggregate({
      where: { assessmentId: data.assessmentId },
      _max: { position: true },
    });
    const firstPosition = (maxPosition._max.position ?? -1) + 1;

    if (questionIdsToAttach.length > 0) {
      await tx.assessmentQuestion.createMany({
        data: questionIdsToAttach.map((questionId, index) => ({
          assessmentId: data.assessmentId,
          assessmentSectionId: data.sectionId ?? null,
          questionId,
          position: firstPosition + index,
          points: data.points,
        })),
      });
    }

    const attached = await tx.assessmentQuestion.findMany({
      where: { assessmentId: data.assessmentId, questionId: { in: data.questionIds } },
      orderBy: { position: "asc" },
      select: { id: true, questionId: true, assessmentSectionId: true, position: true, points: true },
    });
    await createAuditLog({
      actor,
      action: "ATTACH_QUESTIONS",
      entityType: "ASSESSMENT",
      entityId: data.assessmentId,
      after: { questionIds: questionIdsToAttach, sectionId: data.sectionId ?? null, points: data.points },
      db: tx,
    });

    return {
      assessment: { id: assessment.id, title: assessment.title },
      attached,
      alreadyAttached: existing,
    };
  });
}

export async function updateAssessment(actor: Actor, assessmentId: string, input: CreateAssessmentInput) {
  requirePermission(actor, "assessment:write");

  return prisma.$transaction(async (tx) => {
    const existing = await tx.assessment.findUnique({ where: { id: assessmentId }, select: { id: true } });
    if (!existing) throw new AppError("NOT_FOUND", "Assessment not found");
    await validateTriggerTarget(tx, input);
    const assessment = await tx.assessment.update({
      where: { id: assessmentId },
      data: {
        courseId: input.courseId,
        slug: input.slug,
        title: input.title,
        description: input.description,
        type: input.type,
        feedbackMode: input.feedbackMode,
        passingScore: input.passingScore,
        randomizeOrder: input.randomizeOrder,
        trigger: input.trigger,
        isRequired: input.isRequired,
        maxAttempts: input.maxAttempts ?? null,
        triggerModuleId: input.triggerModuleId ?? null,
        triggerLessonId: input.triggerLessonId ?? null,
      },
    });
    await createAuditLog({ actor, action: "UPDATE", entityType: "ASSESSMENT", entityId: assessment.id, after: assessment, db: tx });
    return assessment;
  });
}

async function assertAssessmentUnlocked(
  tx: TransactionClient,
  assessment: { trigger: AssessmentTrigger; triggerModuleId: string | null; triggerLessonId: string | null; courseId: string },
  userId: string,
) {
  if (assessment.trigger === AssessmentTrigger.MANUAL) return;

  if (assessment.trigger === AssessmentTrigger.LESSON_COMPLETED) {
    const progress = assessment.triggerLessonId
      ? await tx.lessonProgress.findUnique({ where: { userId_lessonId: { userId, lessonId: assessment.triggerLessonId } }, select: { status: true } })
      : null;
    if (progress?.status !== "COMPLETED") throw new AppError("FORBIDDEN", "Complete the required lesson before starting this assessment");
    return;
  }

  const lessons = await tx.lesson.findMany({
    where: {
      status: ContentStatus.PUBLISHED,
      ...(assessment.trigger === AssessmentTrigger.MODULE_COMPLETED
        ? { moduleId: assessment.triggerModuleId ?? "" }
        : { module: { courseId: assessment.courseId } }),
    },
    select: { id: true, progress: { where: { userId }, select: { status: true } } },
  });
  if (lessons.length === 0 || lessons.some((lesson) => lesson.progress[0]?.status !== "COMPLETED")) {
    throw new AppError("FORBIDDEN", "Complete the required learning content before starting this assessment");
  }
}

export async function startAssessmentAttempt(actor: Actor, input: StartAttemptInput | string): Promise<LearnerAttempt> {
  requireLearner(actor);
  const { assessmentId } = startAttemptInputSchema.parse(typeof input === "string" ? { assessmentId: input } : input);

  return prisma.$transaction(async (tx) => {
    const assessment = await tx.assessment.findFirst({
      where: {
        id: assessmentId,
        status: ContentStatus.PUBLISHED,
        course: { status: ContentStatus.PUBLISHED, enrollments: { some: { userId: actor.id } } },
      },
      include: {
        questions: { orderBy: { position: "asc" }, include: { question: { include: { choices: { orderBy: { position: "asc" } }, concepts: true } } } },
        sections: { orderBy: { position: "asc" }, include: { questions: { orderBy: { position: "asc" }, include: { question: { include: { choices: { orderBy: { position: "asc" } }, concepts: true } } } } } },
      },
    });

    if (!assessment) {
      throw new AppError("NOT_FOUND", "Assessment not found");
    }

    await assertAssessmentUnlocked(tx, assessment, actor.id);

    const attemptNumber = (await tx.assessmentAttempt.count({ where: { assessmentId, userId: actor.id } })) + 1;
    if (assessment.maxAttempts !== null && attemptNumber > assessment.maxAttempts) {
      throw new AppError("CONFLICT", "Maximum assessment attempts reached");
    }

    const selectionSeed = crypto.randomBytes(16).toString("hex");
    const selected = assessment.sections.length > 0
      ? assessment.sections.flatMap((section) => {
          const pool = section.randomize ? seededShuffle(section.questions, `${selectionSeed}:${section.id}`) : section.questions;
          if (section.questionCount !== null && pool.length < section.questionCount) {
            throw new AppError("VALIDATION", `Inadequate pool for section ${section.title}`);
          }
          return section.questionCount === null ? pool : pool.slice(0, section.questionCount);
        })
      : assessment.randomizeOrder ? seededShuffle(assessment.questions, selectionSeed) : assessment.questions;

    if (selected.length === 0) {
      throw new AppError("VALIDATION", "Assessment has no available questions");
    }

    const attempt = await tx.assessmentAttempt.create({
      data: {
        assessmentId,
        userId: actor.id,
        attemptNumber,
        selectionSeed,
        questions: {
          create: selected.map((assessmentQuestion, position) => ({
            position,
            questionId: assessmentQuestion.question.id,
            questionVersion: assessmentQuestion.question.version,
            questionType: assessmentQuestion.question.type,
            promptSnapshot: assessmentQuestion.question.prompt,
            choicesSnapshot: assessmentQuestion.question.choices.map(({ id, position: choicePosition, text }) => ({ id, position: choicePosition, text })),
            answerConfigSnapshot: assessmentQuestion.question.answerConfig as Prisma.InputJsonValue,
            conceptIdsSnapshot: assessmentQuestion.question.concepts.map((concept) => concept.id),
            points: assessmentQuestion.points,
          })),
        },
      },
      include: {
        assessment: { select: { id: true, title: true, description: true, feedbackMode: true, passingScore: true } },
        questions: { orderBy: { position: "asc" }, select: { id: true, position: true, questionType: true, promptSnapshot: true, choicesSnapshot: true, points: true } },
      },
    }) as unknown as {
      id: string;
      isSubmitted: boolean;
      assessment: { id: string; title: string; description: string | null; feedbackMode: string; passingScore: number };
      questions: Array<{ id: string; position: number; questionType: QuestionType; promptSnapshot: string; choicesSnapshot: Prisma.JsonValue | null; points: number }>;
    };
    await createAuditLog({ actor, action: "START", entityType: "ASSESSMENT_ATTEMPT", entityId: attempt.id, after: { assessmentId }, db: tx });
    return toLearnerAttempt(attempt);
  });
}

export async function getLearnerAttempt(actor: Actor, attemptId: string): Promise<LearnerAttempt> {
  requireLearner(actor);
  const attempt = await prisma.assessmentAttempt.findFirst({
    where: { id: attemptId, userId: actor.id, isSubmitted: false },
    include: {
      assessment: { select: { id: true, title: true, description: true, feedbackMode: true, passingScore: true } },
      questions: { orderBy: { position: "asc" }, select: { id: true, position: true, questionType: true, promptSnapshot: true, choicesSnapshot: true, points: true } },
    },
  });
  if (!attempt) throw new AppError("NOT_FOUND", "Attempt not found");
  return toLearnerAttempt(attempt);
}

export async function submitAssessmentAttempt(actor: Actor, input: SubmitAttemptInput): Promise<AssessmentResult> {
  requireLearner(actor);
  const parsedInput = submitAttemptInputSchema.parse(input);

  return prisma.$transaction(async (tx: TransactionClient) => {
    const attempt = await tx.assessmentAttempt.findFirst({
      where: { id: parsedInput.attemptId, userId: actor.id },
      include: { assessment: true, questions: { orderBy: { position: "asc" } } },
    });
    if (!attempt) throw new AppError("NOT_FOUND", "Attempt not found");
    if (attempt.isSubmitted) throw new AppError("CONFLICT", "Attempt already submitted");

    const answers = attempt.questions.map((question) => {
      const answer = parsedInput.answers[question.id];
      if (answer === undefined) throw new AppError("VALIDATION", `Missing answer for question ${question.id}`);
      const isCorrect = gradeAnswer({ type: question.questionType, answerConfig: question.answerConfigSnapshot }, answer).isCorrect;
      return { attemptQuestionId: question.id, answer: answer as Prisma.InputJsonValue, isCorrect, pointsAwarded: isCorrect ? question.points : 0 };
    });
    const score = answers.reduce((total, answer) => total + answer.pointsAwarded, 0);
    const totalPoints = attempt.questions.reduce((total, question) => total + question.points, 0);
    const percentage = Math.round((score / totalPoints) * 100);
    const passed = percentage >= attempt.assessment.passingScore;

    await tx.attemptAnswer.createMany({ data: answers });
    await tx.assessmentAttempt.update({ where: { id: attempt.id }, data: { isSubmitted: true, submittedAt: new Date(), score, percentage, passed } });

    const masteryUpdates = new Map<string, { correct: number; incorrect: number }>();
    for (const [index, question] of attempt.questions.entries()) {
      for (const conceptId of question.conceptIdsSnapshot) {
        const current = masteryUpdates.get(conceptId) ?? { correct: 0, incorrect: 0 };
        if (answers[index].isCorrect) current.correct += 1;
        else current.incorrect += 1;
        masteryUpdates.set(conceptId, current);
      }
      if (!answers[index].isCorrect) {
        const conceptIds = question.conceptIdsSnapshot.length > 0 ? question.conceptIdsSnapshot : [null];
        for (const conceptId of conceptIds) {
          const existing = await tx.mistakeRecord.findFirst({ where: { userId: actor.id, questionId: question.questionId, conceptId } });
          if (existing) await tx.mistakeRecord.update({ where: { id: existing.id }, data: { wrongCount: { increment: 1 }, lastSeenAt: new Date(), resolvedAt: null, attemptQuestionId: question.id } });
          else await tx.mistakeRecord.create({ data: { userId: actor.id, questionId: question.questionId, conceptId, attemptQuestionId: question.id } });
        }
      }
    }
    for (const [conceptId, update] of masteryUpdates) {
      const existing = await tx.userConceptMastery.findUnique({ where: { userId_conceptId: { userId: actor.id, conceptId } } });
      const correctCount = (existing?.correctCount ?? 0) + update.correct;
      const incorrectCount = (existing?.incorrectCount ?? 0) + update.incorrect;
      await tx.userConceptMastery.upsert({
        where: { userId_conceptId: { userId: actor.id, conceptId } },
        create: { userId: actor.id, conceptId, correctCount, incorrectCount, masteryPercent: calculateMastery(correctCount, incorrectCount) },
        update: { correctCount, incorrectCount, masteryPercent: calculateMastery(correctCount, incorrectCount) },
      });
    }
    await createAuditLog({ actor, action: "SUBMIT", entityType: "ASSESSMENT_ATTEMPT", entityId: attempt.id, after: { score, percentage, passed }, db: tx });
    return { score, percentage, passed };
  });
}

export async function getLearnerAssessmentResult(actor: Actor, attemptId: string): Promise<LearnerAssessmentResult> {
  requireLearner(actor);
  const attempt = await prisma.assessmentAttempt.findFirst({
    where: { id: attemptId, userId: actor.id, isSubmitted: true },
    include: { assessment: { select: { title: true } }, questions: { orderBy: { position: "asc" }, include: { answers: true } } },
  });
  if (!attempt || attempt.score === null || attempt.percentage === null || attempt.passed === null || !attempt.submittedAt) throw new AppError("NOT_FOUND", "Submitted attempt not found");
  return {
    attemptId: attempt.id,
    assessmentTitle: attempt.assessment.title,
    score: attempt.score,
    percentage: attempt.percentage,
    passed: attempt.passed,
    submittedAt: attempt.submittedAt,
    questions: attempt.questions.map((question) => ({
      id: question.id,
      position: question.position,
      prompt: question.promptSnapshot,
      points: question.points,
      pointsAwarded: question.answers[0]?.pointsAwarded ?? 0,
      isCorrect: question.answers[0]?.isCorrect ?? false,
      answer: question.answers[0]?.answer ?? null,
    })),
  };
}

export async function getAssessmentHistory(actor: Actor, userId: string) {
  requirePermission(actor, "analytics:read");
  if (actor.type === "USER" && actor.id !== userId) throw new AppError("FORBIDDEN", "Users can only view their own assessment history");
  return prisma.assessmentAttempt.findMany({
    where: { userId, isSubmitted: true },
    orderBy: { submittedAt: "desc" },
    select: { id: true, submittedAt: true, score: true, percentage: true, passed: true, assessment: { select: { id: true, slug: true, title: true, type: true } } },
  });
}
