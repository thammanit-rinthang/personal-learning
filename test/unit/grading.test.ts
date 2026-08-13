import { describe, expect, it } from "vitest";
import { gradeAnswer } from "@/services/question.service";
import { QuestionType } from "@/app/generated/prisma/client";

describe("Question Grading", () => {
  describe("SINGLE_CHOICE", () => {
    const config = { expectedChoiceId: "choice-1" };
    
    it("grades correct answer", () => {
      expect(gradeAnswer({ type: QuestionType.SINGLE_CHOICE, answerConfig: config }, { choiceId: "choice-1" }).isCorrect).toBe(true);
    });

    it("grades incorrect answer", () => {
      expect(gradeAnswer({ type: QuestionType.SINGLE_CHOICE, answerConfig: config }, { choiceId: "choice-2" }).isCorrect).toBe(false);
    });
  });

  describe("MULTIPLE_CHOICE", () => {
    const config = { expectedChoiceIds: ["choice-1", "choice-2"] };

    it("grades correct answer (order independent)", () => {
      expect(gradeAnswer({ type: QuestionType.MULTIPLE_CHOICE, answerConfig: config }, { choiceIds: ["choice-2", "choice-1"] }).isCorrect).toBe(true);
    });

    it("grades incorrect answer (missing choice)", () => {
      expect(gradeAnswer({ type: QuestionType.MULTIPLE_CHOICE, answerConfig: config }, { choiceIds: ["choice-1"] }).isCorrect).toBe(false);
    });

    it("grades incorrect answer (extra choice)", () => {
      expect(gradeAnswer({ type: QuestionType.MULTIPLE_CHOICE, answerConfig: config }, { choiceIds: ["choice-1", "choice-2", "choice-3"] }).isCorrect).toBe(false);
    });
  });

  describe("TRUE_FALSE", () => {
    const config = { expectedBoolean: true };

    it("grades correct answer", () => {
      expect(gradeAnswer({ type: QuestionType.TRUE_FALSE, answerConfig: config }, { value: true }).isCorrect).toBe(true);
    });

    it("grades incorrect answer", () => {
      expect(gradeAnswer({ type: QuestionType.TRUE_FALSE, answerConfig: config }, { value: false }).isCorrect).toBe(false);
    });
  });

  describe("NUMERIC", () => {
    const config = { expected: "100.5", tolerance: "0.1" };

    it("grades correct exact answer", () => {
      expect(gradeAnswer({ type: QuestionType.NUMERIC, answerConfig: config }, { value: "100.5" }).isCorrect).toBe(true);
    });

    it("grades correct answer within tolerance", () => {
      expect(gradeAnswer({ type: QuestionType.NUMERIC, answerConfig: config }, { value: "100.55" }).isCorrect).toBe(true);
      expect(gradeAnswer({ type: QuestionType.NUMERIC, answerConfig: config }, { value: "100.45" }).isCorrect).toBe(true);
    });

    it("grades incorrect answer outside tolerance", () => {
      expect(gradeAnswer({ type: QuestionType.NUMERIC, answerConfig: config }, { value: "100.61" }).isCorrect).toBe(false);
      expect(gradeAnswer({ type: QuestionType.NUMERIC, answerConfig: config }, { value: "100.39" }).isCorrect).toBe(false);
    });
  });

  describe("Invalid Payloads", () => {
    it("returns false for invalid payload structure", () => {
      expect(gradeAnswer({ type: QuestionType.SINGLE_CHOICE, answerConfig: { expectedChoiceId: "c1" } }, { wrongKey: "c1" }).isCorrect).toBe(false);
      expect(gradeAnswer({ type: QuestionType.NUMERIC, answerConfig: { expected: "1", tolerance: "0" } }, { value: "not-a-number" }).isCorrect).toBe(false);
    });
  });
});
