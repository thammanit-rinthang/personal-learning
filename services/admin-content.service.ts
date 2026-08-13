import "server-only";

import { prisma } from "@/db/prisma";
import type { Actor } from "@/server/actor";
import { requirePermission, requireRole } from "@/server/authorization";

export async function listAssessments(actor: Actor) {
  requirePermission(actor, "assessment:read");
  return prisma.assessment.findMany({ orderBy: { updatedAt: "desc" }, select: { id: true, title: true, slug: true, type: true, status: true, version: true, passingScore: true, _count: { select: { questions: true, sections: true } } } });
}

export async function listReviewQueue(actor: Actor) {
  requireRole(actor, ["REVIEWER", "ADMIN"]);
  return prisma.contentRevision.findMany({ where: { status: "DRAFT" }, orderBy: { createdAt: "desc" }, take: 50, select: { id: true, entityType: true, entityId: true, version: true, summary: true, actorType: true, createdAt: true } });
}
