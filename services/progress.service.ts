import { prisma } from "@/db/prisma";
import { Actor } from "@/server/actor";
import { requirePermission } from "@/server/authorization";
import { AppError } from "@/server/errors";

export type CourseProgress = {
  courseId: string;
  completedLessons: number;
  totalLessons: number;
  progressPercent: number;
};

export async function getCourseProgress(actor: Actor, courseId: string, requestedUserId?: string): Promise<CourseProgress> {
  requirePermission(actor, "analytics:read");
  const userId = requestedUserId ?? actor.id;

  if (actor.type === "USER" && actor.id !== userId) {
    throw new AppError("FORBIDDEN", "Users can only view their own course progress");
  }

  const totalLessons = await prisma.lesson.count({
    where: {
      module: { courseId },
      status: "PUBLISHED"
    }
  });

  if (totalLessons === 0) {
    return { courseId, completedLessons: 0, totalLessons: 0, progressPercent: 0 };
  }

  const completedLessons = await prisma.lessonProgress.count({
    where: {
      userId,
      lesson: {
        module: { courseId },
        status: "PUBLISHED"
      },
      status: "COMPLETED"
    }
  });

  const progressPercent = Math.round((completedLessons / totalLessons) * 100);

  return {
    courseId,
    completedLessons,
    totalLessons,
    progressPercent
  };
}
