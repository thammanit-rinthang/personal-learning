import { describe, expect, it, beforeEach } from "vitest";
import { prisma } from "../../db/prisma";
import { createLessonDraft } from "../../services/lesson.service";
import { attachSourceToLesson } from "../../services/source.service";
import { validateLesson } from "../../services/validation.service";
import { type Actor } from "../../server/actor";

describe("Lesson Service Integration", () => {
  const actor: Actor = {
    id: "user-1",
    type: "USER",
    permissions: ["lesson:write", "lesson:read"],
  };

  beforeEach(async () => {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "AuditLog", "LessonSource", "Source", "LessonBlock", "LessonProgress", "Lesson", "Module", "Course", "Subject", "User" CASCADE;`);
    await prisma.user.upsert({ where: { id: "user-1" }, create: { id: "user-1", email: "test@test.com", name: "Test User" }, update: {} });
  });

  it("validates missing objectives in a lesson", async () => {
    const subject = await prisma.subject.create({
      data: { slug: "subj-3", title: "Subj" },
    });
    const course = await prisma.course.create({
      data: { subjectId: subject.id, slug: "course-3", title: "Course 3" },
    });
    const mod = await prisma.module.create({
      data: { courseId: course.id, slug: "m1", title: "M1", position: 0 },
    });

    // Create directly with Prisma to bypass creation validation
    const lesson = await prisma.lesson.create({
      data: {
        moduleId: mod.id,
        slug: "lesson-no-obj",
        title: "Lesson",
        position: 0,
        objectives: [],
      },
    });

    const result = await validateLesson(actor, lesson.id);
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "missing_objectives" }),
      ])
    );
  });

  it("attaches a source to a lesson", async () => {
    const subject = await prisma.subject.create({
      data: { slug: "subj-4", title: "Subj" },
    });
    const course = await prisma.course.create({
      data: { subjectId: subject.id, slug: "course-4", title: "Course 4" },
    });
    const mod = await prisma.module.create({
      data: { courseId: course.id, slug: "m2", title: "M2", position: 0 },
    });
    const lesson = await createLessonDraft(actor, {
      moduleId: mod.id,
      slug: "lesson-1",
      title: "Lesson 1",
      position: 0,
      objectives: ["Objective 1"],
    });
    const source = await prisma.source.create({
      data: {
        title: "Source 1",
        sourceType: "Book",
        publisher: "Pub",
        checkedAt: new Date(),
      },
    });

    await attachSourceToLesson(actor, {
      lessonId: lesson.id,
      sourceId: source.id,
    });

    const links = await prisma.lessonSource.findMany();
    expect(links).toHaveLength(1);
    expect(links[0].lessonId).toBe(lesson.id);
    expect(links[0].sourceId).toBe(source.id);
  });
});
