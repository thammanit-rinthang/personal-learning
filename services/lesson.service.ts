import "server-only";
import { prisma } from "@/db/prisma";
import { type Actor } from "@/server/actor";
import { requirePermission } from "@/server/authorization";
import { createAuditLog } from "@/server/audit";
import { type LessonCreate, lessonCreateSchema, type UpsertLessonBlocks, upsertLessonBlocksSchema } from "@/schemas/lesson.schema";
import { ContentStatus } from "@/app/generated/prisma/enums";
import type { Prisma } from "@/app/generated/prisma/client";
import { AppError } from "@/server/errors";

export async function createLessonDraft(actor: Actor, input: LessonCreate) {
  requirePermission(actor, "lesson:write");
  const data = lessonCreateSchema.parse(input);

  return prisma.$transaction(async (tx) => {
    const lesson = await tx.lesson.create({
      data: {
        moduleId: data.moduleId,
        slug: data.slug,
        title: data.title,
        summary: data.summary,
        objectives: data.objectives,
        position: data.position,
        durationMin: data.durationMin,
        status: ContentStatus.DRAFT,
      },
    });

    await createAuditLog({
      actor,
      action: "CREATE_LESSON",
      entityType: "Lesson",
      entityId: lesson.id,
      after: lesson as unknown as Prisma.InputJsonValue,
      db: tx,
    });

    return lesson;
  });
}

export async function upsertLessonBlocks(actor: Actor, lessonId: string, input: UpsertLessonBlocks) {
  requirePermission(actor, "lesson:write");
  const data = upsertLessonBlocksSchema.parse(input);

  return prisma.$transaction(async (tx) => {
    // Delete existing blocks
    await tx.lessonBlock.deleteMany({
      where: { lessonId },
    });

    const blocks = [];
    for (const b of data.blocks) {
      const block = await tx.lessonBlock.create({
        data: {
          lessonId,
          type: b.type,
          position: b.position,
          contentMarkdown: b.contentMarkdown,
          data: b.data ? JSON.parse(JSON.stringify(b.data)) : undefined,
        },
      });
      blocks.push(block);
    }

    await createAuditLog({
      actor,
      action: "UPSERT_LESSON_BLOCKS",
      entityType: "Lesson",
      entityId: lessonId,
      after: blocks as unknown as Prisma.InputJsonValue,
      db: tx,
    });

    return blocks;
  });
}

export async function reorderLessons(actor: Actor, moduleId: string, lessonIds: string[]) {
  requirePermission(actor, "lesson:write");
  return prisma.$transaction(async (tx) => {
    const lessons = await tx.lesson.findMany({ where: { moduleId }, orderBy: { position: "asc" } });
    if (lessons.length !== lessonIds.length || lessons.some((lesson) => !lessonIds.includes(lesson.id))) throw new AppError("VALIDATION", "Submitted lesson IDs do not match persisted lessons");
    for (const lesson of lessons) await tx.lesson.update({ where: { id: lesson.id }, data: { position: lesson.position + 10000 } });
    for (let index = 0; index < lessonIds.length; index++) await tx.lesson.update({ where: { id: lessonIds[index] }, data: { position: index } });
    await createAuditLog({ actor, action: "REORDER_LESSONS", entityType: "Module", entityId: moduleId, after: { order: lessonIds } as unknown as Prisma.InputJsonValue, db: tx });
  });
}


export async function getLesson(actor: Actor, lessonId: string) {
  requirePermission(actor, "lesson:read");

  const lesson = await prisma.lesson.findFirst({
    where: {
      id: lessonId,
      ...(actor.type === "MCP" ? { status: ContentStatus.PUBLISHED } : {}),
    },
    include: {
      module: {
        select: {
          id: true,
          slug: true,
          title: true,
          course: { select: { id: true, slug: true, title: true } },
        },
      },
      blocks: { orderBy: { position: "asc" } },
      concepts: { select: { id: true, slug: true, title: true } },
    },
  });

  if (!lesson) {
    throw new AppError("NOT_FOUND", "Lesson not found");
  }

  return lesson;
}
