import "server-only";
import { prisma } from "@/db/prisma";
import { type Actor } from "@/server/actor";
import { requirePermission } from "@/server/authorization";
import { createAuditLog } from "@/server/audit";
import { type CourseCreate, courseCreateSchema, type CourseUpdate, courseUpdateSchema, moduleCreateSchema } from "@/schemas/course.schema";
import { AppError } from "@/server/errors";
import { ContentStatus } from "@/app/generated/prisma/enums";
import type { Prisma } from "@/app/generated/prisma/client";

export async function createCourseDraft(actor: Actor, input: CourseCreate) {
  requirePermission(actor, "course:write");
  const data = courseCreateSchema.parse(input);

  return prisma.$transaction(async (tx) => {
    const course = await tx.course.create({
      data: {
        subjectId: data.subjectId,
        slug: data.slug,
        title: data.title,
        description: data.description,
        status: ContentStatus.DRAFT,
      },
    });

    await createAuditLog({
      actor,
      action: "CREATE_COURSE",
      entityType: "Course",
      entityId: course.id,
      after: course as unknown as Prisma.InputJsonValue,
      db: tx,
    });

    return course;
  });
}


export async function createModule(actor: Actor, input: { courseId: string; slug: string; title: string; description?: string; position: number }) {
  requirePermission(actor, "course:write");
  const data = moduleCreateSchema.parse(input);

  return prisma.$transaction(async (tx) => {
    const courseModule = await tx.module.create({ data });
    await createAuditLog({
      actor,
      action: "CREATE_MODULE",
      entityType: "Module",
      entityId: courseModule.id,
      after: courseModule as unknown as Prisma.InputJsonValue,
      db: tx,
    });
    return courseModule;
  });
}

export async function updateCourse(actor: Actor, courseId: string, input: CourseUpdate) {
  requirePermission(actor, "course:write");
  const data = courseUpdateSchema.parse(input);

  return prisma.$transaction(async (tx) => {
    const before = await tx.course.findUnique({ where: { id: courseId } });
    if (!before) throw new AppError("NOT_FOUND", "Course not found");
    if (before.status === ContentStatus.PUBLISHED) {
      await tx.contentRevision.create({
        data: {
          entityType: "COURSE",
          entityId: courseId,
          version: before.version + 1,
          status: ContentStatus.DRAFT,
          snapshot: { ...before, ...data } as Prisma.InputJsonValue,
          summary: "Course edit proposed from published content",
          actorId: actor.type === "USER" ? actor.id : undefined,
          actorType: actor.type,
        },
      });
      await createAuditLog({ actor, action: "CREATE_DRAFT_REVISION", entityType: "COURSE", entityId: courseId, before: before as Prisma.InputJsonValue, after: data as Prisma.InputJsonValue, db: tx });
      return before;
    }
    if (actor.type === "MCP" && before.status !== ContentStatus.DRAFT && !actor.permissions.includes("content:write_all")) throw new AppError("FORBIDDEN", "MCP may only update draft content");
    const course = await tx.course.update({ where: { id: courseId }, data });
    await createAuditLog({ actor, action: "UPDATE_COURSE", entityType: "COURSE", entityId: course.id, before: before as Prisma.InputJsonValue, after: course as Prisma.InputJsonValue, db: tx });
    return course;
  });
}

export async function updateCourseBySlug(actor: Actor, courseSlug: string, input: CourseUpdate) {
  requirePermission(actor, "course:write");
  const course = await prisma.course.findUnique({ where: { slug: courseSlug }, select: { id: true } });
  if (!course) throw new AppError("NOT_FOUND", "Course not found");
  return updateCourse(actor, course.id, input);
}

export async function reorderModules(actor: Actor, courseId: string, moduleIds: string[]) {
  requirePermission(actor, "course:write");

  return prisma.$transaction(async (tx) => {
    const modules = await tx.module.findMany({
      where: { courseId },
      orderBy: { position: "asc" },
    });

    const persistedIds = modules.map(m => m.id).sort();
    const submittedIds = [...moduleIds].sort();

    if (persistedIds.length !== submittedIds.length || !persistedIds.every((v, i) => v === submittedIds[i])) {
      throw new AppError("VALIDATION", "Submitted module IDs do not match persisted IDs");
    }

    // Temporarily offset positions to avoid unique constraint violations
    for (const m of modules) {
      await tx.module.update({
        where: { id: m.id },
        data: { position: m.position + 10000 },
      });
    }

    // Write final contiguous positions
    for (let i = 0; i < moduleIds.length; i++) {
      await tx.module.update({
        where: { id: moduleIds[i] },
        data: { position: i },
      });
    }

    await createAuditLog({
      actor,
      action: "REORDER_MODULES",
      entityType: "Course",
      entityId: courseId,
      after: { order: moduleIds } as unknown as Prisma.InputJsonValue,
      db: tx,
    });
  });
}

export async function updateModule(actor: Actor, moduleId: string, input: { title?: string; description?: string }) {
  requirePermission(actor, "course:write");
  const data = moduleCreateSchema.pick({ title: true, description: true }).parse(input);
  return prisma.$transaction(async (tx) => {
    const before = await tx.module.findUnique({ where: { id: moduleId } });
    if (!before) throw new AppError("NOT_FOUND", "Module not found");
    const updated = await tx.module.update({ where: { id: moduleId }, data });
    await createAuditLog({ actor, action: "UPDATE_MODULE", entityType: "Module", entityId: moduleId, before: before as Prisma.InputJsonValue, after: updated as Prisma.InputJsonValue, db: tx });
    return updated;
  });
}

export async function archiveCourse(actor: Actor, courseId: string) {
  requirePermission(actor, "course:write");
  return prisma.$transaction(async (tx) => {
    const before = await tx.course.findUnique({ where: { id: courseId } });
    if (!before) throw new AppError("NOT_FOUND", "Course not found");
    const course = await tx.course.update({ where: { id: courseId }, data: { status: ContentStatus.ARCHIVED } });
    await createAuditLog({ actor, action: "ARCHIVE_COURSE", entityType: "Course", entityId: courseId, before: before as Prisma.InputJsonValue, after: course as Prisma.InputJsonValue, db: tx });
    return course;
  });
}

export async function getCourse(actor: Actor, courseId: string) {
  requirePermission(actor, "course:read");

  const course = await prisma.course.findFirst({
    where: {
      id: courseId,
      ...(actor.type === "MCP" && !actor.permissions.includes("content:read_all") ? { status: ContentStatus.PUBLISHED } : {}),
      ...(actor.type === "USER" && actor.role === "LEARNER"
        ? { status: ContentStatus.PUBLISHED, enrollments: { some: { userId: actor.id } } }
        : {}),
    },
    include: {
      subject: { select: { id: true, slug: true, title: true } },
      modules: {
        orderBy: { position: "asc" },
        include: {
          lessons: {
            where: actor.type === "MCP" && !actor.permissions.includes("content:read_all") ? { status: ContentStatus.PUBLISHED } : undefined,
            orderBy: { position: "asc" },
            select: { id: true, slug: true, title: true, summary: true, status: true, position: true, durationMin: true },
          },
        },
      },
    },
  });

  if (!course) {
    throw new AppError("NOT_FOUND", "Course not found");
  }

  return course;
}

export async function listCourses(actor: Actor) {
  requirePermission(actor, "course:read");

  return prisma.course.findMany({
    where: actor.type === "MCP" && !actor.permissions.includes("content:read_all")
      ? { status: ContentStatus.PUBLISHED }
      : actor.type === "USER" && actor.role === "LEARNER"
        ? { status: ContentStatus.PUBLISHED, enrollments: { some: { userId: actor.id } } }
        : undefined,
    orderBy: { title: "asc" },
    select: { id: true, slug: true, title: true, description: true, status: true, version: true },
  });
}

export async function listModules(actor: Actor, courseId: string) {
  const course = await getCourse(actor, courseId);
  return course.modules;
}
