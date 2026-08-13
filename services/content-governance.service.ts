import "server-only";

import { ContentStatus } from "@/app/generated/prisma/client";
import type { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/db/prisma";
import { type Actor } from "@/server/actor";
import { requireRole } from "@/server/authorization";
import { createAuditLog } from "@/server/audit";
import { AppError } from "@/server/errors";
import { publishContentInputSchema, reviewContentInputSchema, type PublishContentInput, type ReviewContentInput } from "@/schemas/admin.schema";

type ContentEntityType = "COURSE" | "LESSON" | "QUESTION" | "ASSESSMENT";

function requireHuman(actor: Actor, roles: Array<"REVIEWER" | "ADMIN">) {
  if (actor.type !== "USER") throw new AppError("FORBIDDEN", "This operation requires a human user");
  requireRole(actor, roles);
}

async function findContent(tx: Prisma.TransactionClient, entityType: ContentEntityType, entityId: string) {
  switch (entityType) {
    case "COURSE": return tx.course.findUnique({ where: { id: entityId } });
    case "LESSON": return tx.lesson.findUnique({ where: { id: entityId } });
    case "QUESTION": return tx.question.findUnique({ where: { id: entityId } });
    case "ASSESSMENT": return tx.assessment.findUnique({ where: { id: entityId } });
  }
}

async function setContentStatus(tx: Prisma.TransactionClient, entityType: ContentEntityType, entityId: string, status: ContentStatus, version?: number) {
  const data = version === undefined ? { status } : { status, version };
  switch (entityType) {
    case "COURSE": return tx.course.update({ where: { id: entityId }, data });
    case "LESSON": return tx.lesson.update({ where: { id: entityId }, data });
    case "QUESTION": return tx.question.update({ where: { id: entityId }, data });
    case "ASSESSMENT": return tx.assessment.update({ where: { id: entityId }, data });
  }
}

export async function requestContentReview(actor: Actor, input: ReviewContentInput) {
  requireHuman(actor, ["REVIEWER", "ADMIN"]);
  const data = reviewContentInputSchema.parse(input);
  return prisma.$transaction(async (tx) => {
    const content = await findContent(tx, data.entityType, data.entityId);
    if (!content) throw new AppError("NOT_FOUND", "Content not found");
    if (data.approved && content.status !== ContentStatus.DRAFT) throw new AppError("CONFLICT", "Only draft content can enter review");
    if (!data.approved && content.status !== ContentStatus.IN_REVIEW) throw new AppError("CONFLICT", "Only content in review can be returned to draft");
    const status = data.approved ? ContentStatus.IN_REVIEW : ContentStatus.DRAFT;
    const updated = await setContentStatus(tx, data.entityType, data.entityId, status);
    await createAuditLog({
      actor,
      action: data.approved ? "SUBMIT_FOR_REVIEW" : "RETURN_TO_DRAFT",
      entityType: data.entityType,
      entityId: data.entityId,
      before: content as Prisma.InputJsonValue,
      after: { status, note: data.note } as Prisma.InputJsonValue,
      db: tx,
    });
    return updated;
  });
}

export async function publishContent(actor: Actor, input: PublishContentInput) {
  requireHuman(actor, ["ADMIN"]);
  const data = publishContentInputSchema.parse(input);
  return prisma.$transaction(async (tx) => {
    const content = await findContent(tx, data.entityType, data.entityId);
    if (!content) throw new AppError("NOT_FOUND", "Content not found");
    if (content.status !== ContentStatus.IN_REVIEW) throw new AppError("CONFLICT", "Only content in review can be published");
    const updated = await setContentStatus(tx, data.entityType, data.entityId, ContentStatus.PUBLISHED, content.version + 1);
    await tx.contentRevision.create({
      data: {
        entityType: data.entityType,
        entityId: data.entityId,
        version: content.version + 1,
        status: ContentStatus.PUBLISHED,
        snapshot: updated as Prisma.InputJsonValue,
        summary: "Published by human administrator",
        actorId: actor.id,
        actorType: actor.type,
      },
    });
    await createAuditLog({ actor, action: "PUBLISH_CONTENT", entityType: data.entityType, entityId: data.entityId, before: content as Prisma.InputJsonValue, after: updated as Prisma.InputJsonValue, db: tx });
    return updated;
  });
}

export async function createDraftRevision(actor: Actor, entityType: ContentEntityType, entityId: string, snapshot: Prisma.InputJsonValue, summary: string) {
  if (actor.type === "MCP") throw new AppError("FORBIDDEN", "MCP cannot create revisions for published content");
  return prisma.$transaction(async (tx) => {
    const content = await findContent(tx, entityType, entityId);
    if (!content) throw new AppError("NOT_FOUND", "Content not found");
    if (content.status !== ContentStatus.PUBLISHED) throw new AppError("CONFLICT", "Draft revisions can only be created from published content");
    const revision = await tx.contentRevision.create({
      data: {
        entityType,
        entityId,
        version: content.version + 1,
        status: ContentStatus.DRAFT,
        snapshot,
        summary,
        actorId: actor.id,
        actorType: actor.type,
      },
    });
    await createAuditLog({ actor, action: "CREATE_DRAFT_REVISION", entityType, entityId, before: content as Prisma.InputJsonValue, after: revision as Prisma.InputJsonValue, db: tx });
    return revision;
  });
}
