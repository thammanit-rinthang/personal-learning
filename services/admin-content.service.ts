import "server-only";

import { prisma } from "@/db/prisma";
import type { Actor } from "@/server/actor";
import { requirePermission, requireRole } from "@/server/authorization";

export async function listAssessments(actor: Actor) {
  requirePermission(actor, "assessment:read");
  return prisma.assessment.findMany({ orderBy: { updatedAt: "desc" }, select: { id: true, courseId: true, title: true, slug: true, type: true, status: true, version: true, passingScore: true, trigger: true, isRequired: true, maxAttempts: true, triggerModuleId: true, triggerLessonId: true, _count: { select: { questions: true, sections: true } } } });
}

export async function getAssessmentForAdmin(actor: Actor, assessmentId: string) {
  requirePermission(actor, "assessment:read");
  return prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: { sections: { orderBy: { position: "asc" } } },
  });
}

export async function listAssessmentTargets(actor: Actor) {
  requirePermission(actor, "assessment:read");
  return prisma.course.findMany({
    orderBy: { title: "asc" },
    select: {
      id: true,
      title: true,
      modules: { orderBy: { position: "asc" }, select: { id: true, title: true, lessons: { orderBy: { position: "asc" }, select: { id: true, title: true } } } },
    },
  });
}

export async function listReviewQueue(actor: Actor) {
  requireRole(actor, ["REVIEWER", "ADMIN"]);
  return prisma.contentRevision.findMany({ where: { status: "DRAFT" }, orderBy: { createdAt: "desc" }, take: 50, select: { id: true, entityType: true, entityId: true, version: true, summary: true, actorType: true, createdAt: true } });
}
