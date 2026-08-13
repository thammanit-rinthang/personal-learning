import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";
import { PrismaClient } from "../app/generated/prisma/client";
import { ContentStatus, QuestionType, UserRole } from "../app/generated/prisma/enums";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed the database.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const questionTypes = [
  QuestionType.SINGLE_CHOICE,
  QuestionType.MULTIPLE_CHOICE,
  QuestionType.TRUE_FALSE,
  QuestionType.NUMERIC,
] as const;
const scrypt = promisify(scryptCallback);
const passwordKeyLength = 64;
const adminEmail = process.env.ADMIN_EMAIL ?? "admin@learning.local";
const adminUsername = process.env.ADMIN_USERNAME ?? "admin";
const adminPassword = process.env.ADMIN_PASSWORD;
const learnerEmail = process.env.E2E_LEARNER_EMAIL ?? "learner@learning.local";
const learnerUsername = process.env.E2E_LEARNER_USERNAME ?? "learner";
const learnerPassword = process.env.E2E_LEARNER_PASSWORD;

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const derivedKey = await scrypt(password, salt, passwordKeyLength) as Buffer;
  return `${salt}:${derivedKey.toString("base64url")}`;
}

function questionFixture(index: number) {
  const type = questionTypes[(index - 1) % questionTypes.length];
  const status = index <= 20 ? ContentStatus.PUBLISHED : ContentStatus.DRAFT;

  if (type === QuestionType.NUMERIC) {
    return {
      type,
      status,
      prompt: `Accounting Foundations numeric question ${index}`,
      explanation: "Use the accounting equation to verify the result.",
      hint: "Assets equal liabilities plus equity.",
      difficulty: (index % 5) + 1,
      answerConfig: { expected: String(index * 10), tolerance: "0" },
      choices: [],
    };
  }

  if (type === QuestionType.TRUE_FALSE) {
    const isTrue = index % 2 === 0;

    return {
      type,
      status,
      prompt: `Accounting Foundations true or false question ${index}`,
      explanation: "The explanation is stored with the reusable question.",
      hint: "Review the Accounting Foundations lesson.",
      difficulty: (index % 5) + 1,
      choices: [
        { position: 1, text: "True", isCorrect: isTrue },
        { position: 2, text: "False", isCorrect: !isTrue },
      ],
    };
  }

  const multiple = type === QuestionType.MULTIPLE_CHOICE;

  return {
    type,
    status,
    prompt: `Accounting Foundations ${multiple ? "multiple-choice" : "single-choice"} question ${index}`,
    explanation: "The explanation is stored with the reusable question.",
    hint: "Identify which entries preserve the accounting equation.",
    difficulty: (index % 5) + 1,
    choices: [
      { position: 1, text: "Option A", isCorrect: true },
      { position: 2, text: "Option B", isCorrect: false },
      { position: 3, text: "Option C", isCorrect: multiple },
      { position: 4, text: "Option D", isCorrect: false },
    ],
  };
}

async function main() {
  const adminPasswordHash = adminPassword ? await hashPassword(adminPassword) : undefined;
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { name: "MVP Admin", username: adminUsername, role: UserRole.ADMIN, ...(adminPasswordHash ? { passwordHash: adminPasswordHash } : {}) },
    create: { email: adminEmail, username: adminUsername, name: "MVP Admin", role: UserRole.ADMIN, passwordHash: adminPasswordHash },
  });

  const learnerPasswordHash = learnerPassword ? await hashPassword(learnerPassword) : undefined;
  const learner = await prisma.user.upsert({
    where: { email: learnerEmail },
    update: { name: "MVP Learner", username: learnerUsername, role: UserRole.LEARNER, ...(learnerPasswordHash ? { passwordHash: learnerPasswordHash } : {}) },
    create: { email: learnerEmail, username: learnerUsername, name: "MVP Learner", role: UserRole.LEARNER, passwordHash: learnerPasswordHash },
  });

  const subject = await prisma.subject.upsert({
    where: { slug: "accounting" },
    update: { title: "Accounting", description: "Foundational accounting learning paths." },
    create: { slug: "accounting", title: "Accounting", description: "Foundational accounting learning paths." },
  });

  const course = await prisma.course.upsert({
    where: { slug: "accounting-pre-master" },
    update: {
      subjectId: subject.id,
      title: "Accounting Pre-Master",
      description: "A practical foundation in core accounting concepts.",
      status: ContentStatus.PUBLISHED,
    },
    create: {
      subjectId: subject.id,
      slug: "accounting-pre-master",
      title: "Accounting Pre-Master",
      description: "A practical foundation in core accounting concepts.",
      status: ContentStatus.PUBLISHED,
    },
  });

  const weekOneModule = await prisma.module.upsert({
    where: { courseId_position: { courseId: course.id, position: 1 } },
    update: {
      slug: "module-01",
      title: "Module 01 / Week 01",
      description: "Accounting Foundations for Week 01.",
      unlockRule: { type: "PREVIOUS_MODULE_COMPLETED" },
    },
    create: {
      courseId: course.id,
      slug: "module-01",
      title: "Module 01 / Week 01",
      description: "Accounting Foundations for Week 01.",
      position: 1,
      unlockRule: { type: "PREVIOUS_MODULE_COMPLETED" },
    },
  });

  const concepts = await Promise.all(
    [
      ["accounting-equation", "Accounting Equation", "Assets equal liabilities plus equity."],
      ["profit-vs-cash", "Profit vs Cash", "Profit and cash flow measure different things."],
      ["double-entry", "Double-Entry Bookkeeping", "Each transaction affects at least two accounts."],
    ].map(([slug, title, description]) =>
      prisma.concept.upsert({
        where: { slug },
        update: { title, description },
        create: { slug, title, description },
      }),
    ),
  );

  const lesson = await prisma.lesson.upsert({
    where: { moduleId_position: { moduleId: weekOneModule.id, position: 1 } },
    update: {
      slug: "accounting-foundations",
      title: "Accounting Foundations",
      summary: "Learn the accounting equation, double-entry thinking, and why profit differs from cash.",
      objectives: ["Explain the accounting equation", "Distinguish profit from cash", "Identify double-entry effects"],
      status: ContentStatus.PUBLISHED,
      durationMin: 45,
      concepts: { set: concepts.map(({ id }) => ({ id })) },
    },
    create: {
      moduleId: weekOneModule.id,
      slug: "accounting-foundations",
      title: "Accounting Foundations",
      summary: "Learn the accounting equation, double-entry thinking, and why profit differs from cash.",
      objectives: ["Explain the accounting equation", "Distinguish profit from cash", "Identify double-entry effects"],
      status: ContentStatus.PUBLISHED,
      position: 1,
      durationMin: 45,
      concepts: { connect: concepts.map(({ id }) => ({ id })) },
    },
  });

  await Promise.all(
    [
      { type: "HEADING", position: 1, contentMarkdown: "# Accounting Foundations" },
      { type: "MARKDOWN", position: 2, contentMarkdown: "Assets = Liabilities + Equity." },
      { type: "EXAMPLE", position: 3, contentMarkdown: "A cash investment increases both assets and equity." },
    ].map(({ position, ...data }) =>
      prisma.lessonBlock.upsert({
        where: { lessonId_position: { lessonId: lesson.id, position } },
        update: data,
        create: { lessonId: lesson.id, position, ...data },
      }),
    ),
  );

  const source = await prisma.source.upsert({
    where: { id: `seed-source-${course.id}` },
    update: {
      courseId: course.id,
      title: "Week 01 Accounting Foundations Reference",
       sourceType: "INTERNAL_REFERENCE",
       publisher: "Personal Learning OS",
       checkedAt: new Date("2026-08-10T00:00:00.000Z"),
      jurisdiction: "TH",
      effectiveFrom: new Date("2026-08-10T00:00:00.000Z"),
      effectiveUntil: null,
      notes: "Seeded Week 01 reference maintained for the MVP.",
    },
    create: {
       id: `seed-source-${course.id}`,
       course: { connect: { id: course.id } },
       title: "Week 01 Accounting Foundations Reference",
       sourceType: "INTERNAL_REFERENCE",
       publisher: "Personal Learning OS",
       author: "Personal Learning OS",
       citation: "Week 01 internal learning reference.",
      checkedAt: new Date("2026-08-10T00:00:00.000Z"),
      jurisdiction: "TH",
      effectiveFrom: new Date("2026-08-10T00:00:00.000Z"),
      notes: "Seeded Week 01 reference maintained for the MVP.",
    },
  });

  await prisma.lessonSource.upsert({
    where: { lessonId_sourceId: { lessonId: lesson.id, sourceId: source.id } },
    update: {},
    create: { lessonId: lesson.id, sourceId: source.id },
  });

  const questions = await Promise.all(
    Array.from({ length: 50 }, async (_, offset) => {
      const fixture = questionFixture(offset + 1);
      const concept = concepts[offset % concepts.length];
      const seedKey = `accounting-foundations-question-${offset + 1}`;
      const existingQuestion = await prisma.question.findUnique({
        where: { seedKey },
        select: { id: true },
      });

      if (existingQuestion) {
        await prisma.questionSource.deleteMany({ where: { questionId: existingQuestion.id } });
        await prisma.questionChoice.deleteMany({ where: { questionId: existingQuestion.id } });
      }

      const question = await prisma.question.upsert({
        where: { seedKey },
        update: {
          type: fixture.type,
          status: fixture.status,
          prompt: fixture.prompt,
          explanation: fixture.explanation,
          hint: fixture.hint,
          difficulty: fixture.difficulty,
          answerConfig: fixture.type === QuestionType.NUMERIC ? fixture.answerConfig : {},
          concepts: { set: [{ id: concept.id }] },
          choices: fixture.choices.length > 0 ? { create: fixture.choices } : undefined,
          sources: { create: { sourceId: source.id } },
        },
        create: {
          seedKey,
          type: fixture.type,
          status: fixture.status,
          prompt: fixture.prompt,
          explanation: fixture.explanation,
          hint: fixture.hint,
          difficulty: fixture.difficulty,
          answerConfig: fixture.type === QuestionType.NUMERIC ? fixture.answerConfig : {},
          concepts: { connect: { id: concept.id } },
          choices: fixture.choices.length > 0 ? { create: fixture.choices } : undefined,
          sources: { create: { sourceId: source.id } },
        },
        include: { choices: true },
      });

      if (fixture.type !== QuestionType.NUMERIC) {
        await prisma.question.update({
          where: { id: question.id },
          data: {
            answerConfig: {
              correct: question.choices.filter(({ isCorrect }) => isCorrect).map(({ id }) => id),
            },
          },
        });
      }

      return question;
    }),
  );

  const assessment = await prisma.assessment.upsert({
    where: { courseId_slug: { courseId: course.id, slug: "week-01-quiz" } },
    update: {
      title: "Week 01 Quiz",
      description: "A 20-question Accounting Foundations assessment blueprint.",
      type: "QUIZ",
      status: ContentStatus.PUBLISHED,
      feedbackMode: "AFTER_SUBMIT",
      passingScore: 80,
      randomizeOrder: true,
    },
    create: {
      courseId: course.id,
      slug: "week-01-quiz",
      title: "Week 01 Quiz",
      description: "A 20-question Accounting Foundations assessment blueprint.",
      type: "QUIZ",
      status: ContentStatus.PUBLISHED,
      feedbackMode: "AFTER_SUBMIT",
      passingScore: 80,
      randomizeOrder: true,
    },
  });

  const section = await prisma.assessmentSection.upsert({
    where: { assessmentId_position: { assessmentId: assessment.id, position: 1 } },
    update: {
      title: "Accounting Foundations",
      instructions: "Answer all 20 questions.",
      questionCount: 20,
      randomize: true,
    },
    create: {
      assessmentId: assessment.id,
      title: "Accounting Foundations",
      instructions: "Answer all 20 questions.",
      position: 1,
      questionCount: 20,
      randomize: true,
    },
  });

  await Promise.all(
    questions.map((question, index) =>
      prisma.assessmentQuestion.upsert({
        where: { assessmentId_questionId: { assessmentId: assessment.id, questionId: question.id } },
        update: { assessmentSectionId: section.id, position: index + 1, points: 1 },
        create: {
          assessmentId: assessment.id,
          assessmentSectionId: section.id,
          questionId: question.id,
          position: index + 1,
          points: 1,
        },
      }),
    ),
  );

  await prisma.courseEnrollment.upsert({
    where: { userId_courseId: { userId: learner.id, courseId: course.id } },
    update: {},
    create: { userId: learner.id, courseId: course.id },
  });

  await prisma.contentRevision.upsert({
    where: { entityType_entityId_version: { entityType: "COURSE", entityId: course.id, version: 1 } },
    update: { snapshot: { slug: course.slug, title: course.title }, actorId: admin.id },
    create: {
      entityType: "COURSE",
      entityId: course.id,
      version: 1,
      status: ContentStatus.PUBLISHED,
      snapshot: { slug: course.slug, title: course.title },
      summary: "Initial Week 01 course fixture.",
      actorId: admin.id,
    },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error: unknown) => {
    await prisma.$disconnect();
    throw error;
  });
