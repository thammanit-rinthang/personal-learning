import "server-only";

import { prisma } from "@/db/prisma";
import { type Actor } from "@/server/actor";
import { requirePermission } from "@/server/authorization";
import { createAuditLog } from "@/server/audit";
import { AppError } from "@/server/errors";
import {
  type AttachConcept,
  attachConceptSchema,
  type AttachSource,
  attachSourceSchema,
  type AttachSourceToQuestion,
  attachSourceToQuestionSchema,
  type SourceCreate,
  sourceCreateSchema,
  type SourceListInput,
  sourceListInputSchema,
  type SourceUpdate,
  sourceUpdateSchema,
} from "@/schemas/source.schema";

export async function createSource(actor: Actor, input: SourceCreate) {
  requirePermission(actor, "source:write");
  const data = sourceCreateSchema.parse(input);
  return prisma.$transaction(async (tx) => {
    const source = await tx.source.create({ data });
    await createAuditLog({ actor, action: "CREATE_SOURCE", entityType: "SOURCE", entityId: source.id, after: source, db: tx });
    return source;
  });
}

export async function listSources(actor: Actor, input: Partial<SourceListInput> = {}) {
  requirePermission(actor, "source:read");
  const data = sourceListInputSchema.parse(input);
  const where = data.courseId ? { courseId: data.courseId } : undefined;
  const [items, total] = await prisma.$transaction([
    prisma.source.findMany({ where, orderBy: { checkedAt: "desc" }, skip: (data.page - 1) * data.pageSize, take: data.pageSize }),
    prisma.source.count({ where }),
  ]);
  return { items, total, page: data.page, pageSize: data.pageSize };
}

export async function getSource(actor: Actor, sourceId: string) {
  requirePermission(actor, "source:read");
  const source = await prisma.source.findUnique({ where: { id: sourceId } });
  if (!source) throw new AppError("NOT_FOUND", "Source not found");
  return source;
}

export async function updateSource(actor: Actor, sourceId: string, input: SourceUpdate) {
  requirePermission(actor, "source:write");
  const data = sourceUpdateSchema.parse(input);
  return prisma.$transaction(async (tx) => {
    const before = await tx.source.findUnique({ where: { id: sourceId } });
    if (!before) throw new AppError("NOT_FOUND", "Source not found");
    const source = await tx.source.update({ where: { id: sourceId }, data });
    await createAuditLog({ actor, action: "UPDATE_SOURCE", entityType: "SOURCE", entityId: source.id, before, after: source, db: tx });
    return source;
  });
}

export async function deleteSource(actor: Actor, sourceId: string) {
  requirePermission(actor, "source:write");
  return prisma.$transaction(async (tx) => {
    const before = await tx.source.findUnique({ where: { id: sourceId } });
    if (!before) throw new AppError("NOT_FOUND", "Source not found");
    await tx.source.delete({ where: { id: sourceId } });
    await createAuditLog({ actor, action: "DELETE_SOURCE", entityType: "SOURCE", entityId: sourceId, before, db: tx });
  });
}

export async function attachConceptToLesson(actor: Actor, input: AttachConcept) {
  requirePermission(actor, "lesson:write");
  const data = attachConceptSchema.parse(input);
  return prisma.$transaction(async (tx) => {
    const lesson = await tx.lesson.update({ where: { id: data.lessonId }, data: { concepts: { connect: { id: data.conceptId } } } });
    await createAuditLog({ actor, action: "ATTACH_CONCEPT", entityType: "LESSON", entityId: lesson.id, after: { conceptId: data.conceptId }, db: tx });
    return lesson;
  });
}

export async function attachSourceToLesson(actor: Actor, input: AttachSource) {
  requirePermission(actor, "lesson:write");
  const data = attachSourceSchema.parse(input);
  return prisma.$transaction(async (tx) => {
    const link = await tx.lessonSource.create({ data: { lessonId: data.lessonId, sourceId: data.sourceId } });
    await createAuditLog({ actor, action: "ATTACH_SOURCE", entityType: "LESSON", entityId: data.lessonId, after: link, db: tx });
    return link;
  });
}

export async function attachSourceToQuestion(actor: Actor, input: AttachSourceToQuestion) {
  requirePermission(actor, "question:write");
  const data = attachSourceToQuestionSchema.parse(input);
  return prisma.$transaction(async (tx) => {
    const link = await tx.questionSource.create({ data });
    await createAuditLog({ actor, action: "ATTACH_SOURCE", entityType: "QUESTION", entityId: data.questionId, after: link, db: tx });
    return link;
  });
}
