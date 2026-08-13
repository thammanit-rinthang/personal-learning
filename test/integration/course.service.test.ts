import { describe, expect, it, beforeEach } from "vitest";
import { prisma } from "../../db/prisma";
import { createCourseDraft, reorderModules } from "../../services/course.service";
import { type Actor } from "../../server/actor";

describe("Course Service Integration", () => {
  const actor: Actor = {
    id: "user-1",
    type: "USER",
    permissions: ["course:write"],
  };

  beforeEach(async () => {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "AuditLog", "Module", "Course", "Subject", "User" CASCADE;`);
    await prisma.user.upsert({ where: { id: "user-1" }, create: { id: "user-1", email: "test@test.com", name: "Test User" }, update: {} });
  });

  it("creates a course and an audit log", async () => {
    const subject = await prisma.subject.create({
      data: { slug: "subj", title: "Subj" },
    });

    const course = await createCourseDraft(actor, {
      subjectId: subject.id,
      slug: "test-course",
      title: "Test Course",
    });

    expect(course.title).toBe("Test Course");

    const logs = await prisma.auditLog.findMany();
    expect(logs).toHaveLength(1);
    expect(logs[0].action).toBe("CREATE_COURSE");
    expect(logs[0].entityId).toBe(course.id);
  });

  it("reorders modules transactionally", async () => {
    const subject = await prisma.subject.create({
      data: { slug: "subj-2", title: "Subj" },
    });
    const course = await prisma.course.create({
      data: { subjectId: subject.id, slug: "course-1", title: "Course 1" },
    });
    const m1 = await prisma.module.create({
      data: { courseId: course.id, slug: "m1", title: "M1", position: 0 },
    });
    const m2 = await prisma.module.create({
      data: { courseId: course.id, slug: "m2", title: "M2", position: 1 },
    });

    await reorderModules(actor, course.id, [m2.id, m1.id]);

    const updatedM1 = await prisma.module.findUnique({ where: { id: m1.id } });
    const updatedM2 = await prisma.module.findUnique({ where: { id: m2.id } });

    expect(updatedM1?.position).toBe(1);
    expect(updatedM2?.position).toBe(0);
  });
});
