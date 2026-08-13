import { execFile as execFileCallback } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../app/generated/prisma/client";
import { ContentStatus } from "../../app/generated/prisma/enums";
import prismaConfig from "../../prisma.config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const connectionString = prismaConfig.datasource?.url;

if (typeof connectionString !== "string") {
  throw new Error("Prisma datasource URL is required for schema integration tests.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});
const execFile = promisify(execFileCallback);

async function createAssessmentAttemptFixture() {
  const suffix = randomUUID();
  const subject = await prisma.subject.create({
    data: { slug: `attempt-subject-${suffix}`, title: "Attempt test subject" },
  });
  const course = await prisma.course.create({
    data: { subjectId: subject.id, slug: `attempt-course-${suffix}`, title: "Attempt test course" },
  });
  const assessment = await prisma.assessment.create({
    data: { courseId: course.id, slug: `attempt-assessment-${suffix}`, title: "Attempt test assessment", type: "QUIZ" },
  });
  const user = await prisma.user.create({
    data: { email: `attempt-user-${suffix}@example.test`, name: "Attempt test learner" },
  });

  return { assessment, course, subject, suffix, user };
}

async function deleteAssessmentAttemptFixture(input: {
  courseId: string;
  subjectId: string;
  userId: string;
}) {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "AttemptAnswer" DISABLE TRIGGER "AttemptAnswer_reject_submitted_mutation";
    ALTER TABLE "AttemptQuestion" DISABLE TRIGGER "AttemptQuestion_reject_submitted_mutation";
    ALTER TABLE "AssessmentAttempt" DISABLE TRIGGER "AssessmentAttempt_reject_submitted_mutation";
  `);
  await prisma.$executeRaw`
    DELETE FROM "AttemptAnswer"
    WHERE "attemptQuestionId" IN (
      SELECT "id" FROM "AttemptQuestion" WHERE "attemptId" IN (
        SELECT "id" FROM "AssessmentAttempt" WHERE "assessmentId" IN (
          SELECT "id" FROM "Assessment" WHERE "courseId" = ${input.courseId}
        )
      )
    )
  `;
  await prisma.$executeRaw`
    DELETE FROM "AttemptQuestion"
    WHERE "attemptId" IN (
      SELECT "id" FROM "AssessmentAttempt" WHERE "assessmentId" IN (
        SELECT "id" FROM "Assessment" WHERE "courseId" = ${input.courseId}
      )
    )
  `;
  await prisma.$executeRaw`
    DELETE FROM "AssessmentAttempt"
    WHERE "assessmentId" IN (
      SELECT "id" FROM "Assessment" WHERE "courseId" = ${input.courseId}
    )
  `;
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "AttemptAnswer" ENABLE TRIGGER "AttemptAnswer_reject_submitted_mutation";
    ALTER TABLE "AttemptQuestion" ENABLE TRIGGER "AttemptQuestion_reject_submitted_mutation";
    ALTER TABLE "AssessmentAttempt" ENABLE TRIGGER "AssessmentAttempt_reject_submitted_mutation";
  `);
  await prisma.assessment.deleteMany({ where: { courseId: input.courseId } });
  await prisma.course.delete({ where: { id: input.courseId } });
  await prisma.user.delete({ where: { id: input.userId } });
  await prisma.subject.delete({ where: { id: input.subjectId } });
}

async function createCourseFixture() {
  const suffix = randomUUID();
  const subject = await prisma.subject.create({
    data: {
      slug: `schema-constraint-subject-${suffix}`,
      title: "Schema constraint test subject",
    },
  });
  const course = await prisma.course.create({
    data: {
      subjectId: subject.id,
      slug: `schema-constraint-course-${suffix}`,
      title: "Schema constraint test course",
      status: ContentStatus.DRAFT,
    },
  });

  return { course, subject };
}

async function deleteCourseFixture(courseId: string, subjectId: string) {
  await prisma.course.delete({ where: { id: courseId } });
  await prisma.subject.delete({ where: { id: subjectId } });
}

describe.sequential("learning OS PostgreSQL constraints", () => {
  beforeAll(async () => {
    await expect(
      execFile("cmd.exe", ["/d", "/s", "/c", "pnpm db:seed"], { cwd: path.resolve(".") }),
    ).resolves.toBeDefined();
    await prisma.$connect();
  }, 15_000);

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("rejects duplicate course slugs", async () => {
    const { course, subject } = await createCourseFixture();

    try {
      await expect(
        prisma.course.create({
          data: {
            subjectId: subject.id,
            slug: course.slug,
            title: "Duplicate course slug",
          },
        }),
      ).rejects.toMatchObject({ code: "P2002" });
    } finally {
      await deleteCourseFixture(course.id, subject.id);
    }
  });

  it("rejects duplicate module positions within a course", async () => {
    const { course, subject } = await createCourseFixture();

    try {
      await prisma.module.create({
        data: {
          courseId: course.id,
          slug: "first-module",
          title: "First module",
          position: 1,
        },
      });

      await expect(
        prisma.module.create({
          data: {
            courseId: course.id,
            slug: "duplicate-position-module",
            title: "Duplicate module position",
            position: 1,
          },
        }),
      ).rejects.toMatchObject({ code: "P2002" });
    } finally {
      await deleteCourseFixture(course.id, subject.id);
    }
  });

  it("rejects duplicate lesson positions within a module", async () => {
    const { course, subject } = await createCourseFixture();

    try {
      const courseModule = await prisma.module.create({
        data: {
          courseId: course.id,
          slug: "lesson-position-module",
          title: "Lesson position module",
          position: 1,
        },
      });

      await prisma.lesson.create({
        data: {
          moduleId: courseModule.id,
          slug: "first-lesson",
          title: "First lesson",
          objectives: [],
          position: 1,
        },
      });

      await expect(
        prisma.lesson.create({
          data: {
            moduleId: courseModule.id,
            slug: "duplicate-position-lesson",
            title: "Duplicate lesson position",
            objectives: [],
            position: 1,
          },
        }),
      ).rejects.toMatchObject({ code: "P2002" });
    } finally {
      await deleteCourseFixture(course.id, subject.id);
    }
  });

  it("rejects mistake records that reference missing questions", async () => {
    const { course, subject } = await createCourseFixture();
    const user = await prisma.user.create({
      data: {
        email: `schema-constraint-user-${randomUUID()}@example.test`,
        name: "Schema constraint test learner",
      },
    });

    try {
      await expect(
        prisma.mistakeRecord.create({
          data: {
            userId: user.id,
            questionId: "missing-question",
          },
        }),
      ).rejects.toBeDefined();
    } finally {
      await prisma.user.delete({ where: { id: user.id } });
      await deleteCourseFixture(course.id, subject.id);
    }
  });

  it("rejects mistake records that reference missing attempt questions", async () => {
    const { course, subject } = await createCourseFixture();
    const user = await prisma.user.create({
      data: {
        email: `schema-constraint-user-${randomUUID()}@example.test`,
        name: "Schema constraint test learner",
      },
    });

    try {
      await expect(
        prisma.mistakeRecord.create({
          data: {
            userId: user.id,
            attemptQuestionId: "missing-attempt-question",
          },
        }),
      ).rejects.toBeDefined();
    } finally {
      await prisma.user.delete({ where: { id: user.id } });
      await deleteCourseFixture(course.id, subject.id);
    }
  });

  it("persists required source freshness metadata", async () => {
    const { course, subject } = await createCourseFixture();
    const checkedAt = new Date("2026-08-10T00:00:00.000Z");
    const effectiveFrom = new Date("2026-01-01T00:00:00.000Z");
    const effectiveUntil = new Date("2026-12-31T00:00:00.000Z");

    try {
      const source = await prisma.source.create({
        data: {
          course: { connect: { id: course.id } },
          title: "Regulatory accounting reference",
          sourceType: "REGULATION",
          publisher: "Revenue Department",
          checkedAt,
          jurisdiction: "TH",
          effectiveFrom,
          effectiveUntil,
          notes: "Reviewed for the Week 01 curriculum.",
        },
      });

      expect(source).toMatchObject({
        sourceType: "REGULATION",
        checkedAt,
        jurisdiction: "TH",
        effectiveFrom,
        effectiveUntil,
        notes: "Reviewed for the Week 01 curriculum.",
      });
    } finally {
      await deleteCourseFixture(course.id, subject.id);
    }
  });

  it("requires a publisher column and seeds the Week 01 source publisher", async () => {
    const [publisherColumn, seededSource] = await Promise.all([
      prisma.$queryRaw<Array<{ isNullable: string }>>`
        SELECT is_nullable AS "isNullable"
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'Source'
          AND column_name = 'publisher'
      `,
      prisma.$queryRaw<Array<{ publisher: string | null }>>`
        SELECT "publisher"
        FROM "Source"
        WHERE "title" = 'Week 01 Accounting Foundations Reference'
      `,
    ]);

    expect(publisherColumn).toEqual([{ isNullable: "NO" }]);
    expect(seededSource).toEqual([{ publisher: "Personal Learning OS" }]);
  });

  it("retires the legacy Source.lessonId foreign key after backfilling LessonSource", async () => {
    const [legacyColumn, legacyForeignKey] = await Promise.all([
      prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'Source'
            AND column_name = 'lessonId'
        ) AS "exists"
      `,
      prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'Source_lessonId_fkey'
        ) AS "exists"
      `,
    ]);

    expect(legacyColumn[0]?.exists).toBe(false);
    expect(legacyForeignKey[0]?.exists).toBe(false);
  });

  it("has a QuestionSource join table with foreign keys to questions and sources", async () => {
    const rows = await prisma.$queryRaw<Array<{ constraintCount: number }>>`
      SELECT COUNT(*)::integer AS "constraintCount"
      FROM pg_constraint
      WHERE contype = 'f'
        AND conrelid = '"QuestionSource"'::regclass
    `;

    expect(rows[0]?.constraintCount).toBe(2);
  });

  it("attaches one source to two lessons and rejects a duplicate lesson-source pair", async () => {
    const { course, subject } = await createCourseFixture();

    try {
      const courseModule = await prisma.module.create({
        data: {
          courseId: course.id,
          slug: "lesson-source-module",
          title: "Lesson source module",
          position: 1,
        },
      });
      const [firstLesson, secondLesson] = await Promise.all(
        [1, 2].map((position) =>
          prisma.lesson.create({
            data: {
              moduleId: courseModule.id,
              slug: `lesson-source-${position}`,
              title: `Lesson source ${position}`,
              objectives: [],
              position,
            },
          }),
        ),
      );
      const source = await prisma.source.create({
        data: {
          courseId: course.id,
          title: "Reusable lesson source",
          sourceType: "REFERENCE",
          publisher: "Personal Learning OS",
          checkedAt: new Date("2026-08-10T00:00:00.000Z"),
        },
      });

      await prisma.lessonSource.createMany({
        data: [
          { lessonId: firstLesson.id, sourceId: source.id },
          { lessonId: secondLesson.id, sourceId: source.id },
        ],
      });

      await expect(
        prisma.lessonSource.create({
          data: { lessonId: firstLesson.id, sourceId: source.id },
        }),
      ).rejects.toMatchObject({ code: "P2002" });

      await expect(prisma.lessonSource.findMany({ where: { sourceId: source.id } })).resolves.toHaveLength(2);
    } finally {
      await deleteCourseFixture(course.id, subject.id);
    }
  });

  it("orders migration foreign keys after their referenced tables", async () => {
    const migrationsPath = path.resolve("prisma/migrations");
    const migrationNames = (await readdir(migrationsPath, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
    const migrations = await Promise.all(
      migrationNames.map(async (name) => ({
        name,
        sql: await readFile(path.join(migrationsPath, name, "migration.sql"), "utf8"),
      })),
    );
    const createdAt = new Map<string, number>();

    for (const [index, migration] of migrations.entries()) {
      for (const match of migration.sql.matchAll(/CREATE TABLE\s+"([^"]+)"/g)) {
        createdAt.set(match[1]!, index);
      }
    }

    for (const [index, migration] of migrations.entries()) {
      for (const match of migration.sql.matchAll(
        /ALTER TABLE\s+"([^"]+)"[\s\S]*?REFERENCES\s+"([^"]+)"/g,
      )) {
        const [, sourceTable, targetTable] = match;

        expect(createdAt.get(sourceTable!)).toBeLessThanOrEqual(index);
        expect(createdAt.get(targetTable!)).toBeLessThanOrEqual(index);
      }
    }
  });

  it("preserves a non-fixture user and matching-prefix question across a seed rerun", async () => {
    const fixture = await createCourseFixture();
    const suffix = randomUUID();
    const user = await prisma.user.create({
      data: { email: `accounting-foundations-user-${suffix}@example.test`, name: "Non-fixture learner" },
    });
    const question = await prisma.question.create({
      data: {
        type: "TRUE_FALSE",
        prompt: `Accounting Foundations true or false question ${suffix}`,
        answerConfig: { correct: true },
      },
    });

    try {
      await expect(
        execFile("cmd.exe", ["/d", "/s", "/c", "pnpm db:seed"], { cwd: path.resolve(".") }),
      ).resolves.toBeDefined();
      await expect(prisma.user.findUnique({ where: { id: user.id } })).resolves.toMatchObject({ id: user.id });
      await expect(prisma.question.findUnique({ where: { id: question.id } })).resolves.toMatchObject({ id: question.id });
    } finally {
      await prisma.question.delete({ where: { id: question.id } });
      await prisma.user.delete({ where: { id: user.id } });
      await deleteCourseFixture(fixture.course.id, fixture.subject.id);
    }
  }, 15_000);

  it("seeds the Week 01 quiz passing score, pool, random section, and valid choice answer configs", async () => {
    const assessment = await prisma.assessment.findFirstOrThrow({
      where: { slug: "week-01-quiz" },
      include: {
        sections: {
          include: {
            questions: {
              include: {
                question: {
                  include: { choices: true },
                },
              },
            },
          },
        },
      },
    });
    const section = assessment.sections[0];

    expect(assessment.passingScore).toBe(80);
    expect(section).toMatchObject({ questionCount: 20, randomize: true });
    expect(section?.questions).toHaveLength(50);

    for (const { question } of section?.questions ?? []) {
      if (question.choices.length === 0) {
        continue;
      }

      const answerConfig = question.answerConfig as { correct?: unknown };
      expect(answerConfig.correct).toEqual(expect.any(Array));
      expect(answerConfig.correct).not.toHaveLength(0);
      expect(answerConfig.correct).toEqual(
        expect.arrayContaining(question.choices.filter(({ isCorrect }) => isCorrect).map(({ id }) => id)),
      );
      expect((answerConfig.correct as string[]).every((id) => question.choices.some((choice) => choice.id === id))).toBe(true);
    }
  });

  it("rejects direct insertion of an initially submitted attempt", async () => {
    const fixture = await createAssessmentAttemptFixture();

    try {
      await expect(
        prisma.assessmentAttempt.create({
          data: {
            assessmentId: fixture.assessment.id,
            userId: fixture.user.id,
            attemptNumber: 1,
            selectionSeed: fixture.suffix,
            isSubmitted: true,
            submittedAt: new Date(),
          },
        }),
      ).rejects.toThrow("Assessment attempts must be created as drafts");
    } finally {
      await deleteAssessmentAttemptFixture({
        courseId: fixture.course.id,
        subjectId: fixture.subject.id,
        userId: fixture.user.id,
      });
    }
  });

  it("rejects insertion of draft children under a submitted parent chain", async () => {
    const fixture = await createAssessmentAttemptFixture();

    try {
      const attempt = await prisma.assessmentAttempt.create({
        data: {
          assessmentId: fixture.assessment.id,
          userId: fixture.user.id,
          attemptNumber: 1,
          selectionSeed: fixture.suffix,
        },
      });
      const draftQuestion = await prisma.attemptQuestion.create({
        data: {
          attemptId: attempt.id,
          position: 1,
          questionVersion: 1,
          questionType: "TRUE_FALSE",
          promptSnapshot: "Draft question",
          answerConfigSnapshot: { expected: true },
          conceptIdsSnapshot: [],
        },
      });

      await prisma.assessmentAttempt.update({
        where: { id: attempt.id },
        data: { isSubmitted: true, submittedAt: new Date() },
      });

      await expect(
        prisma.attemptQuestion.create({
          data: {
            attemptId: attempt.id,
            position: 2,
            questionVersion: 1,
          questionType: "TRUE_FALSE",
            promptSnapshot: "Late question",
            answerConfigSnapshot: { expected: true },
            conceptIdsSnapshot: [],
          },
        }),
      ).rejects.toThrow("Submitted assessment attempts are immutable");
      await expect(
        prisma.attemptAnswer.create({
          data: {
            attemptQuestionId: draftQuestion.id,
            answer: true,
            isCorrect: true,
          },
        }),
      ).rejects.toThrow("Submitted assessment attempts are immutable");
    } finally {
      await deleteAssessmentAttemptFixture({
        courseId: fixture.course.id,
        subjectId: fixture.subject.id,
        userId: fixture.user.id,
      });
    }
  });

  it("allows draft attempt creation and finalization but rejects reopening", async () => {
    const fixture = await createAssessmentAttemptFixture();

    try {
      const attempt = await prisma.assessmentAttempt.create({
        data: {
          assessmentId: fixture.assessment.id,
          userId: fixture.user.id,
          attemptNumber: 1,
          selectionSeed: fixture.suffix,
        },
      });
      const attemptQuestion = await prisma.attemptQuestion.create({
        data: {
          attemptId: attempt.id,
          position: 1,
          questionVersion: 1,
          questionType: "TRUE_FALSE",
          promptSnapshot: "Draft question",
          answerConfigSnapshot: { expected: true },
          conceptIdsSnapshot: [],
        },
      });
      await prisma.attemptAnswer.create({
        data: {
          attemptQuestionId: attemptQuestion.id,
          answer: true,
          isCorrect: true,
        },
      });

      await expect(
        prisma.assessmentAttempt.update({
          where: { id: attempt.id },
          data: { isSubmitted: true, submittedAt: new Date() },
        }),
      ).resolves.toMatchObject({ isSubmitted: true });
      await expect(
        prisma.assessmentAttempt.update({
          where: { id: attempt.id },
          data: { isSubmitted: false, submittedAt: null },
        }),
      ).rejects.toThrow("Submitted assessment attempts are immutable");
    } finally {
      await deleteAssessmentAttemptFixture({
        courseId: fixture.course.id,
        subjectId: fixture.subject.id,
        userId: fixture.user.id,
      });
    }
  });

  it("rejects moving an attempt answer onto a submitted parent chain and rolls back its fixture", async () => {
    const suffix = randomUUID();
    const rollback = new Error("rollback attempt-answer reparenting fixture");
    const userEmail = `attempt-answer-reparenting-${suffix}@example.test`;

    await expect(
      prisma.$transaction(async (tx) => {
        const subject = await tx.subject.create({
          data: { slug: `attempt-answer-reparenting-subject-${suffix}`, title: "Attempt answer reparenting subject" },
        });
        const course = await tx.course.create({
          data: {
            subjectId: subject.id,
            slug: `attempt-answer-reparenting-course-${suffix}`,
            title: "Attempt answer reparenting course",
          },
        });
        const assessment = await tx.assessment.create({
          data: {
            courseId: course.id,
            slug: `attempt-answer-reparenting-assessment-${suffix}`,
            title: "Attempt answer reparenting assessment",
            type: "QUIZ",
          },
        });
        const user = await tx.user.create({
          data: { email: userEmail, name: "Attempt answer reparenting learner" },
        });
        const draftAttempt = await tx.assessmentAttempt.create({
          data: { assessmentId: assessment.id, userId: user.id, attemptNumber: 1, selectionSeed: suffix },
        });
        const submittedAttempt = await tx.assessmentAttempt.create({
          data: { assessmentId: assessment.id, userId: user.id, attemptNumber: 2, selectionSeed: suffix },
        });
        const draftQuestion = await tx.attemptQuestion.create({
          data: {
            attemptId: draftAttempt.id,
            position: 1,
            questionVersion: 1,
          questionType: "TRUE_FALSE",
            promptSnapshot: "Draft attempt question",
            answerConfigSnapshot: { expected: true },
            conceptIdsSnapshot: [],
          },
        });
        const submittedQuestion = await tx.attemptQuestion.create({
          data: {
            attemptId: submittedAttempt.id,
            position: 1,
            questionVersion: 1,
          questionType: "TRUE_FALSE",
            promptSnapshot: "Submitted attempt question",
            answerConfigSnapshot: { expected: true },
            conceptIdsSnapshot: [],
          },
        });
        const answer = await tx.attemptAnswer.create({
          data: { attemptQuestionId: draftQuestion.id, answer: true, isCorrect: true },
        });

        await tx.assessmentAttempt.update({
          where: { id: submittedAttempt.id },
          data: { isSubmitted: true, submittedAt: new Date() },
        });

        await expect(
          tx.attemptAnswer.update({
            where: { id: answer.id },
            data: { attemptQuestionId: submittedQuestion.id },
          }),
        ).rejects.toThrow("Submitted assessment attempts are immutable");

        throw rollback;
      }),
    ).rejects.toBe(rollback);

    await expect(prisma.user.findUnique({ where: { email: userEmail } })).resolves.toBeNull();
    await expect(
      prisma.subject.findUnique({ where: { slug: `attempt-answer-reparenting-subject-${suffix}` } }),
    ).resolves.toBeNull();
  });

  it("rejects moving an attempt question onto a submitted attempt", async () => {
    const fixture = await createAssessmentAttemptFixture();

    try {
      const draftAttempt = await prisma.assessmentAttempt.create({
        data: { assessmentId: fixture.assessment.id, userId: fixture.user.id, attemptNumber: 1, selectionSeed: fixture.suffix },
      });
      const submittedAttempt = await prisma.assessmentAttempt.create({
        data: { assessmentId: fixture.assessment.id, userId: fixture.user.id, attemptNumber: 2, selectionSeed: fixture.suffix },
      });
      const attemptQuestion = await prisma.attemptQuestion.create({
        data: {
          attemptId: draftAttempt.id,
          position: 1,
          questionVersion: 1,
          questionType: "TRUE_FALSE",
          promptSnapshot: "Draft attempt question",
          answerConfigSnapshot: { expected: true },
          conceptIdsSnapshot: [],
        },
      });
      await prisma.assessmentAttempt.update({
        where: { id: submittedAttempt.id },
        data: { isSubmitted: true, submittedAt: new Date() },
      });

      await expect(
        prisma.attemptQuestion.update({
          where: { id: attemptQuestion.id },
          data: { attemptId: submittedAttempt.id },
        }),
      ).rejects.toThrow("Submitted assessment attempts are immutable");
    } finally {
      await deleteAssessmentAttemptFixture({
        courseId: fixture.course.id,
        subjectId: fixture.subject.id,
        userId: fixture.user.id,
      });
    }
  });

  it("rejects moving an attempt question or answer from a submitted chain to a draft chain", async () => {
    const fixture = await createAssessmentAttemptFixture();

    try {
      const submittedAttempt = await prisma.assessmentAttempt.create({
        data: { assessmentId: fixture.assessment.id, userId: fixture.user.id, attemptNumber: 1, selectionSeed: fixture.suffix },
      });
      const draftAttempt = await prisma.assessmentAttempt.create({
        data: { assessmentId: fixture.assessment.id, userId: fixture.user.id, attemptNumber: 2, selectionSeed: fixture.suffix },
      });
      const submittedAttemptQuestion = await prisma.attemptQuestion.create({
        data: {
          attemptId: submittedAttempt.id,
          position: 1,
          questionVersion: 1,
          questionType: "TRUE_FALSE",
          promptSnapshot: "Submitted attempt question",
          answerConfigSnapshot: { expected: true },
          conceptIdsSnapshot: [],
        },
      });
      const draftAttemptQuestion = await prisma.attemptQuestion.create({
        data: {
          attemptId: draftAttempt.id,
          position: 1,
          questionVersion: 1,
          questionType: "TRUE_FALSE",
          promptSnapshot: "Draft attempt question",
          answerConfigSnapshot: { expected: true },
          conceptIdsSnapshot: [],
        },
      });
      const attemptAnswer = await prisma.attemptAnswer.create({
        data: { attemptQuestionId: submittedAttemptQuestion.id, answer: true, isCorrect: true },
      });
      await prisma.assessmentAttempt.update({
        where: { id: submittedAttempt.id },
        data: { isSubmitted: true, submittedAt: new Date() },
      });

      await expect(
        prisma.attemptQuestion.update({
          where: { id: submittedAttemptQuestion.id },
          data: { attemptId: draftAttempt.id },
        }),
      ).rejects.toThrow("Submitted assessment attempts are immutable");
      await expect(
        prisma.attemptAnswer.update({
          where: { id: attemptAnswer.id },
          data: { attemptQuestionId: draftAttemptQuestion.id },
        }),
      ).rejects.toThrow("Submitted assessment attempts are immutable");
    } finally {
      await deleteAssessmentAttemptFixture({
        courseId: fixture.course.id,
        subjectId: fixture.subject.id,
        userId: fixture.user.id,
      });
    }
  });

  it("rejects mutations to submitted attempts, attempt questions, and attempt answers", async () => {
    const rollback = new Error("rollback submitted-attempt fixture");

    await expect(
      prisma.$transaction(async (tx) => {
        const suffix = randomUUID();
        const subject = await tx.subject.create({
          data: { slug: `submitted-attempt-subject-${suffix}`, title: "Submitted attempt subject" },
        });
        const course = await tx.course.create({
          data: {
            subjectId: subject.id,
            slug: `submitted-attempt-course-${suffix}`,
            title: "Submitted attempt course",
          },
        });
        const assessment = await tx.assessment.create({
          data: {
            courseId: course.id,
            slug: `submitted-attempt-assessment-${suffix}`,
            title: "Submitted attempt assessment",
            type: "QUIZ",
          },
        });
        const user = await tx.user.create({
          data: {
            email: `submitted-attempt-user-${suffix}@example.test`,
            name: "Submitted attempt learner",
          },
        });
        const attempt = await tx.assessmentAttempt.create({
          data: {
            assessmentId: assessment.id,
            userId: user.id,
            attemptNumber: 1,
            selectionSeed: suffix,
          },
        });
        const attemptQuestion = await tx.attemptQuestion.create({
          data: {
            attemptId: attempt.id,
            position: 1,
            questionVersion: 1,
          questionType: "TRUE_FALSE",
            promptSnapshot: "Submitted attempt question",
            answerConfigSnapshot: { expected: true },
            conceptIdsSnapshot: [],
          },
        });
        const attemptAnswer = await tx.attemptAnswer.create({
          data: {
            attemptQuestionId: attemptQuestion.id,
            answer: true,
            isCorrect: true,
          },
        });
        await expect(
          tx.assessmentAttempt.update({
            where: { id: attempt.id },
            data: { isSubmitted: true, submittedAt: new Date() },
          }),
        ).resolves.toMatchObject({ isSubmitted: true });

        const functionName = `assert_submitted_attempt_immutability_${randomUUID().replaceAll("-", "")}`;

        await tx.$executeRawUnsafe(`
          CREATE FUNCTION pg_temp.${functionName}()
          RETURNS TABLE (operation text, rejected boolean)
          LANGUAGE plpgsql
          AS $$
          BEGIN
            BEGIN
              UPDATE "AssessmentAttempt" SET "score" = 1 WHERE "id" = '${attempt.id}';
              RETURN QUERY SELECT 'attempt update', false;
            EXCEPTION WHEN OTHERS THEN
              RETURN QUERY SELECT 'attempt update', true;
            END;
            BEGIN
              DELETE FROM "AssessmentAttempt" WHERE "id" = '${attempt.id}';
              RETURN QUERY SELECT 'attempt delete', false;
            EXCEPTION WHEN OTHERS THEN
              RETURN QUERY SELECT 'attempt delete', true;
            END;
            BEGIN
              UPDATE "AttemptQuestion" SET "points" = 2 WHERE "id" = '${attemptQuestion.id}';
              RETURN QUERY SELECT 'attempt question update', false;
            EXCEPTION WHEN OTHERS THEN
              RETURN QUERY SELECT 'attempt question update', true;
            END;
            BEGIN
              DELETE FROM "AttemptQuestion" WHERE "id" = '${attemptQuestion.id}';
              RETURN QUERY SELECT 'attempt question delete', false;
            EXCEPTION WHEN OTHERS THEN
              RETURN QUERY SELECT 'attempt question delete', true;
            END;
            BEGIN
              UPDATE "AttemptAnswer" SET "pointsAwarded" = 1 WHERE "id" = '${attemptAnswer.id}';
              RETURN QUERY SELECT 'attempt answer update', false;
            EXCEPTION WHEN OTHERS THEN
              RETURN QUERY SELECT 'attempt answer update', true;
            END;
            BEGIN
              DELETE FROM "AttemptAnswer" WHERE "id" = '${attemptAnswer.id}';
              RETURN QUERY SELECT 'attempt answer delete', false;
            EXCEPTION WHEN OTHERS THEN
              RETURN QUERY SELECT 'attempt answer delete', true;
            END;
          END;
          $$;
        `);

        const results = await tx.$queryRawUnsafe<Array<{ operation: string; rejected: boolean }>>(
          `SELECT * FROM pg_temp.${functionName}()`,
        );

        expect(results).toEqual([
          { operation: "attempt update", rejected: true },
          { operation: "attempt delete", rejected: true },
          { operation: "attempt question update", rejected: true },
          { operation: "attempt question delete", rejected: true },
          { operation: "attempt answer update", rejected: true },
          { operation: "attempt answer delete", rejected: true },
        ]);

        throw rollback;
      }),
    ).rejects.toBe(rollback);
  });
});
