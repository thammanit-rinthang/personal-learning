import { prisma } from "@/db/prisma";
import { Actor } from "@/server/actor";
import { requirePermission } from "@/server/authorization";
import { AppError } from "@/server/errors";

export type WeakConcept = {
  conceptId: string;
  slug: string;
  title: string;
  masteryPercent: number;
};

// Pure function for mastery calculation
export function calculateMastery(correctCount: number, incorrectCount: number): number {
  const total = correctCount + incorrectCount;
  if (total === 0) return 0;
  return Math.round((100 * correctCount) / total);
}

export async function getWeakConcepts(actor: Actor, userId: string): Promise<WeakConcept[]> {
  requirePermission(actor, "analytics:read");

  if (actor.type === "USER" && actor.role === "LEARNER" && actor.id !== userId) {
    throw new AppError("FORBIDDEN", "Learners can only view their own weak concepts");
  }

  const masteries = await prisma.userConceptMastery.findMany({
    where: { userId },
    include: { concept: true },
  });

  const weakConcepts: WeakConcept[] = [];
  for (const m of masteries) {
    const total = m.correctCount + m.incorrectCount;
    if (total >= 3 && m.masteryPercent < 70) {
      weakConcepts.push({
        conceptId: m.conceptId,
        slug: m.concept.slug,
        title: m.concept.title,
        masteryPercent: m.masteryPercent,
      });
    }
  }

  return weakConcepts.sort((a, b) => a.masteryPercent - b.masteryPercent);
}


export async function getConceptMastery(actor: Actor, userId: string) {
  requirePermission(actor, "analytics:read");

  if (actor.type === "USER" && actor.id !== userId) {
    throw new AppError("FORBIDDEN", "Users can only view their own concept mastery");
  }

  return prisma.userConceptMastery.findMany({
    where: { userId },
    orderBy: { masteryPercent: "asc" },
    select: {
      conceptId: true,
      correctCount: true,
      incorrectCount: true,
      masteryPercent: true,
      concept: { select: { slug: true, title: true } },
    },
  });
}

export async function getCommonMistakes(actor: Actor, userId: string) {
  requirePermission(actor, "analytics:read");

  if (actor.type === "USER" && actor.id !== userId) {
    throw new AppError("FORBIDDEN", "Users can only view their own mistakes");
  }

  return prisma.mistakeRecord.findMany({
    where: { userId, resolvedAt: null },
    orderBy: [{ wrongCount: "desc" }, { lastSeenAt: "desc" }],
    select: {
      id: true,
      wrongCount: true,
      lastSeenAt: true,
      concept: { select: { id: true, slug: true, title: true } },
      question: { select: { id: true, prompt: true } },
    },
  });
}
