import { describe, expect, it } from "vitest";
import { courseCreateSchema } from "../../schemas/course.schema";
import { lessonCreateSchema, upsertLessonBlocksSchema } from "../../schemas/lesson.schema";

describe("Schema Validations", () => {
  it("rejects blank title in course", () => {
    const result = courseCreateSchema.safeParse({
      subjectId: "subj-1",
      slug: "valid-slug",
      title: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid slug in course", () => {
    const result = courseCreateSchema.safeParse({
      subjectId: "subj-1",
      slug: "invalid_slug!",
      title: "Valid Title",
    });
    expect(result.success).toBe(false);
  });

  it("rejects lesson without learning objectives", () => {
    const result = lessonCreateSchema.safeParse({
      moduleId: "mod-1",
      slug: "valid-lesson-slug",
      title: "Valid Lesson",
      position: 0,
      objectives: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects duplicate block positions", () => {
    const result = upsertLessonBlocksSchema.safeParse({
      blocks: [
        { type: "TEXT", position: 1 },
        { type: "MARKDOWN", position: 1 },
      ],
    });
    expect(result.success).toBe(false);
  });
});
