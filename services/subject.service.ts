import "server-only";

import { prisma } from "@/db/prisma";
import type { Actor } from "@/server/actor";
import { requirePermission } from "@/server/authorization";

export async function listSubjects(actor: Actor) {
  requirePermission(actor, "course:read");
  return prisma.subject.findMany({ select: { id: true, title: true }, orderBy: { title: "asc" } });
}
