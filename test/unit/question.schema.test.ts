import { describe, expect, it } from "vitest";
import { 
  createQuestionInputSchema, 
  questionAnswerConfigSchema 
} from "@/schemas/question.schema";
import { QuestionType } from "@/app/generated/prisma/client";

describe("Question Schemas", () => {
  it("validates SINGLE_CHOICE answer config", () => {
    const valid = { type: QuestionType.SINGLE_CHOICE, answerConfig: { expectedChoiceId: "c1" } };
    expect(() => questionAnswerConfigSchema.parse(valid)).not.toThrow();

    const invalid = { type: QuestionType.SINGLE_CHOICE, answerConfig: { wrongKey: "c1" } };
    expect(() => questionAnswerConfigSchema.parse(invalid)).toThrow();
  });

  it("validates NUMERIC answer config", () => {
    const valid = { type: QuestionType.NUMERIC, answerConfig: { expected: "10", tolerance: "0" } };
    expect(() => questionAnswerConfigSchema.parse(valid)).not.toThrow();

    const invalidNumber = { type: QuestionType.NUMERIC, answerConfig: { expected: 10, tolerance: 0 } };
    expect(() => questionAnswerConfigSchema.parse(invalidNumber)).toThrow();
  });

  it("validates createQuestionInputSchema", () => {
    const valid = {
      type: QuestionType.TRUE_FALSE,
      prompt: "Is this true?",
      answerConfig: { expectedBoolean: true },
      difficulty: 2
    };
    expect(() => createQuestionInputSchema.parse(valid)).not.toThrow();
  });
});
