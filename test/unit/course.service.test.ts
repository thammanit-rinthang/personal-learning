import { describe, it, expect } from "vitest";
import { listCourses } from "@/services/course.service";
import type { Actor } from "@/server/actor";

describe("course.service", () => {
  it("exposes listCourses that requires actor", async () => {
    const actor = { id: "u1", type: "USER", role: "LEARNER", permissions: ["course:read"] } as Actor;
    const rows = await listCourses(actor);
    expect(Array.isArray(rows)).toBe(true);
  });
});
