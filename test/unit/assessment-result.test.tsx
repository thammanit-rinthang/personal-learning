import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AssessmentResult } from "@/components/learning/assessment-result";

describe("AssessmentResult", () => {
  it("renders score and review actions without exposing answer keys", () => {
    render(<AssessmentResult result={{ attemptId: "attempt-123", assessmentTitle: "แบบทดสอบ", score: 8, percentage: 80, passed: true, submittedAt: new Date(), questions: [{ id: "question-123", position: 0, prompt: "คำถาม", points: 1, pointsAwarded: 1, isCorrect: true, answer: { choiceId: "choice-123" } }] }} />);
    expect(screen.getByText("80%")).toBeInTheDocument();
    expect(screen.getByText("ทบทวนข้อที่พลาด")).toBeInTheDocument();
    expect(screen.queryByText("choice-123")).not.toBeInTheDocument();
  });
});
