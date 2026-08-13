import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { expect, test as base } from "@playwright/test";
import { PrismaClient } from "../app/generated/prisma/client";

export const learnerCourseSlug = "accounting-pre-master";
export const learnerModuleSlug = "module-01";
export const learnerLessonSlug = "accounting-foundations";

type Fixtures = {
  assessmentId: string;
};

export const test = base.extend<Fixtures>({
  assessmentId: async ({}, provide) => {
    const connectionString = process.env.E2E_DATABASE_URL;
    if (!connectionString) {
      throw new Error("E2E_DATABASE_URL is required for E2E tests.");
    }

    const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
    const assessment = await prisma.assessment.findFirst({
      where: { slug: "week-01-quiz", course: { slug: learnerCourseSlug } },
      select: { id: true },
    });

    if (!assessment) {
      await prisma.$disconnect();
      throw new Error("The seeded Week 01 quiz was not found.");
    }

    await provide(assessment.id);
    await prisma.$disconnect();
  },
});

export { expect };
