import "server-only";

import { ContentStatus, LessonProgressStatus } from "@/app/generated/prisma/enums";
import { prisma } from "@/db/prisma";
import { createAuditLog } from "@/server/audit";
import type { Prisma } from "@/app/generated/prisma/client";
import type { Actor } from "@/server/actor";
import { requirePermission } from "@/server/authorization";
import { AppError } from "@/server/errors";
import { getAssessmentHistory } from "@/services/assessment.service";
import { getWeakConcepts } from "@/services/mastery.service";
import { getCourseProgress } from "@/services/progress.service";

export type LearnerCourseOutline = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  subjectTitle: string;
  progress: {
    completedLessons: number;
    totalLessons: number;
    percent: number;
  };
  modules: Array<{
    id: string;
    slug: string;
    title: string;
    description: string | null;
    position: number;
    lessons: Array<{
      id: string;
      slug: string;
      title: string;
      summary: string | null;
      durationMin: number | null;
      position: number;
      status: LessonProgressStatus;
    }>;
  }>;
};

function requireLearner(actor: Actor) {
  requirePermission(actor, "course:read");
  if (actor.type !== "USER" || !actor.id) {
    throw new AppError("FORBIDDEN", "Learner access is required");
  }
}

export async function listLearnerCourseCatalog(actor: Actor) {
  requireLearner(actor);
  const courses = await prisma.course.findMany({
    where: { status: ContentStatus.PUBLISHED },
    orderBy: { title: "asc" },
    select: {
      id: true, slug: true, title: true, description: true,
      subject: { select: { title: true } },
      _count: { select: { modules: true } },
      enrollments: { where: { userId: actor.id }, select: { id: true } },
    },
  });

  return courses.map(({ enrollments, ...course }) => ({ ...course, enrolled: enrollments.length > 0 }));
}

export async function enrollInCourse(actor: Actor, courseId: string) {
  requireLearner(actor);
  const course = await prisma.course.findFirst({ where: { id: courseId, status: ContentStatus.PUBLISHED }, select: { id: true, title: true } });
  if (!course) throw new AppError("NOT_FOUND", "Course not found");

  const enrollment = await prisma.courseEnrollment.upsert({
    where: { userId_courseId: { userId: actor.id, courseId } },
    update: {},
    create: { userId: actor.id, courseId },
  });
  await createAuditLog({ actor, action: "ENROLL_COURSE", entityType: "Course", entityId: courseId, after: { courseId, enrollmentId: enrollment.id } as unknown as Prisma.InputJsonValue });
  return enrollment;
}

async function findEnrolledCourse(actor: Actor, courseSlug: string) {
  requireLearner(actor);

  const enrollment = await prisma.courseEnrollment.findFirst({
    where: {
      userId: actor.id,
      course: { slug: courseSlug, status: ContentStatus.PUBLISHED },
    },
    include: {
      course: {
        include: {
          subject: { select: { title: true } },
          modules: {
            orderBy: { position: "asc" },
            include: {
              lessons: {
                where: { status: ContentStatus.PUBLISHED },
                orderBy: { position: "asc" },
                include: { progress: { where: { userId: actor.id }, select: { status: true } } },
              },
            },
          },
        },
      },
    },
  });

  if (!enrollment) {
    throw new AppError("NOT_FOUND", "Course not found");
  }

  return enrollment.course;
}

export async function getLearnerCourseOutline(actor: Actor, courseSlug: string): Promise<LearnerCourseOutline> {
  const course = await findEnrolledCourse(actor, courseSlug);
  const progress = await getCourseProgress(actor, course.id);

  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    description: course.description,
    subjectTitle: course.subject.title,
    progress: {
      completedLessons: progress.completedLessons,
      totalLessons: progress.totalLessons,
      percent: progress.progressPercent,
    },
    modules: course.modules.map((module) => ({
      id: module.id,
      slug: module.slug,
      title: module.title,
      description: module.description,
      position: module.position,
      lessons: module.lessons.map((lesson) => ({
        id: lesson.id,
        slug: lesson.slug,
        title: lesson.title,
        summary: lesson.summary,
        durationMin: lesson.durationMin,
        position: lesson.position,
        status: lesson.progress[0]?.status ?? LessonProgressStatus.NOT_STARTED,
      })),
    })),
  };
}

export async function getLearnerDashboard(actor: Actor) {
  requireLearner(actor);

  const enrollments = await prisma.courseEnrollment.findMany({
    where: { userId: actor.id, course: { status: ContentStatus.PUBLISHED } },
    orderBy: { enrolledAt: "asc" },
    select: { course: { select: { id: true, slug: true, title: true, description: true } } },
  });

  const courses = await Promise.all(
    enrollments.map(async ({ course }) => {
      const outline = await getLearnerCourseOutline(actor, course.slug);
      const nextLesson = outline.modules.flatMap((module) =>
        module.lessons.map((lesson) => ({ ...lesson, moduleSlug: module.slug, moduleTitle: module.title })),
      ).find((lesson) => lesson.status !== LessonProgressStatus.COMPLETED);

      return { course, outline, nextLesson };
    }),
  );

  const continueItem = courses.find(({ nextLesson }) => nextLesson) ?? courses[0];
  const [history, weakConcepts] = await Promise.all([
    getAssessmentHistory(actor, actor.id),
    getWeakConcepts(actor, actor.id),
  ]);
  const catalog = await listLearnerCourseCatalog(actor);

  return {
    continueItem: continueItem
      ? {
          courseSlug: continueItem.course.slug,
          courseTitle: continueItem.course.title,
          progress: continueItem.outline.progress,
          lesson: continueItem.nextLesson
            ? {
                title: continueItem.nextLesson.title,
                moduleTitle: continueItem.nextLesson.moduleTitle,
                href: `/learn/${continueItem.course.slug}/${continueItem.nextLesson.moduleSlug}/${continueItem.nextLesson.slug}`,
              }
            : null,
        }
      : null,
    courses: courses.map(({ course, outline }) => ({
      slug: course.slug,
      title: course.title,
      description: course.description,
      progress: outline.progress,
    })),
    availableCourses: catalog.filter((course) => !course.enrolled),
    recentResult: history[0] ?? null,
    weakConcepts: weakConcepts.slice(0, 3),
  };
}

export async function getLearnerLesson(actor: Actor, courseSlug: string, moduleSlug: string, lessonSlug: string) {
  const outline = await getLearnerCourseOutline(actor, courseSlug);
  const courseModule = outline.modules.find((item) => item.slug === moduleSlug);
  const lessonSummary = courseModule?.lessons.find((item) => item.slug === lessonSlug);

  if (!courseModule || !lessonSummary) {
    throw new AppError("NOT_FOUND", "Lesson not found");
  }

  const lesson = await prisma.lesson.findFirst({
    where: {
      id: lessonSummary.id,
      status: ContentStatus.PUBLISHED,
      module: { course: { status: ContentStatus.PUBLISHED } },
    },
    include: {
      blocks: { orderBy: { position: "asc" } },
      concepts: { select: { slug: true, title: true } },
      sourceLinks: { include: { source: { select: { title: true, citation: true, url: true } } } },
    },
  });

  if (!lesson) {
    throw new AppError("NOT_FOUND", "Lesson not found");
  }

  const allLessons = outline.modules.flatMap((item) =>
    item.lessons.map((itemLesson) => ({ ...itemLesson, moduleSlug: item.slug })),
  );
  const index = allLessons.findIndex((item) => item.id === lesson.id);

  return {
    outline,
    lesson: {
      title: lesson.title,
      summary: lesson.summary,
      objectives: lesson.objectives,
      durationMin: lesson.durationMin,
      blocks: lesson.blocks.map((block) => ({
        id: block.id,
        type: block.type,
        contentMarkdown: block.contentMarkdown,
        data: block.data,
      })),
      concepts: lesson.concepts,
      sources: lesson.sourceLinks.map(({ source }) => source),
      status: lessonSummary.status,
    },
    previousLesson: index > 0 ? allLessons[index - 1] : null,
    nextLesson: index >= 0 && index < allLessons.length - 1 ? allLessons[index + 1] : null,
  };
}

export async function markLessonComplete(actor: Actor, lessonId: string) {
  requireLearner(actor);

  const lesson = await prisma.lesson.findFirst({
    where: {
      id: lessonId,
      status: ContentStatus.PUBLISHED,
      module: { course: { status: ContentStatus.PUBLISHED, enrollments: { some: { userId: actor.id } } } },
    },
    select: { id: true },
  });

  if (!lesson) {
    throw new AppError("NOT_FOUND", "Lesson not found");
  }

  return prisma.$transaction(async (tx) => {
    const progress = await tx.lessonProgress.upsert({
      where: { userId_lessonId: { userId: actor.id, lessonId } },
      create: { userId: actor.id, lessonId, status: LessonProgressStatus.COMPLETED, completedAt: new Date() },
      update: { status: LessonProgressStatus.COMPLETED, completedAt: new Date() },
    });
    await createAuditLog({ actor, action: "COMPLETE_LESSON", entityType: "LESSON_PROGRESS", entityId: progress.id, after: progress, db: tx });
    return progress;
  });
}
