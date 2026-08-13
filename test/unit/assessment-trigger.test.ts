import { describe, expect, it } from "vitest";
import { AssessmentTrigger, AssessmentType, FeedbackMode } from "@/app/generated/prisma/client";
import { attachQuestionsToAssessmentInputSchema, createAssessmentInputSchema } from "@/schemas/assessment.schema";

const base = { courseId: "course-1", slug: "final", title: "Final", type: AssessmentType.QUIZ, feedbackMode: FeedbackMode.AFTER_SUBMIT };

describe("assessment trigger contract", () => {
  it("accepts course completion without a target", () => {
    expect(createAssessmentInputSchema.parse({ ...base, trigger: AssessmentTrigger.COURSE_COMPLETED }).trigger).toBe(AssessmentTrigger.COURSE_COMPLETED);
  });

  it("requires a target for lesson and module completion", () => {
    expect(() => createAssessmentInputSchema.parse({ ...base, trigger: AssessmentTrigger.LESSON_COMPLETED })).toThrow();
    expect(() => createAssessmentInputSchema.parse({ ...base, trigger: AssessmentTrigger.MODULE_COMPLETED })).toThrow();
  });

  it("rejects a target when the trigger is manual", () => {
    expect(() => createAssessmentInputSchema.parse({ ...base, trigger: AssessmentTrigger.MANUAL, triggerLessonId: "lesson-1" })).toThrow();
  });

  it("validates unique question IDs for assessment attachment", () => {
    expect(attachQuestionsToAssessmentInputSchema.parse({ assessmentId: "assessment-1", questionIds: ["q-1", "q-2"] })).toMatchObject({ points: 1 });
    expect(() => attachQuestionsToAssessmentInputSchema.parse({ assessmentId: "assessment-1", questionIds: ["q-1", "q-1"] })).toThrow();
  });
});
