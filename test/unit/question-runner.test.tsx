import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QuestionRunner } from "@/components/learning/question-runner";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }));
vi.mock("@/app/actions/assessment.actions", () => ({ submitAssessmentAttemptAction: vi.fn() }));

afterEach(cleanup);

const attempt = {
  id: "attempt-123",
  assessment: { id: "assessment-123", title: "แบบทดสอบ", description: null, feedbackMode: "AFTER_SUBMIT", passingScore: 70 },
  isSubmitted: false,
  questions: [
    { id: "question-123", position: 0, type: "SINGLE_CHOICE" as const, prompt: "คำถาม", choices: [{ id: "choice-123", position: 0, text: "คำตอบ" }], points: 1 },
    { id: "question-456", position: 1, type: "NUMERIC" as const, prompt: "จำนวน", choices: [], points: 1 },
  ],
};

describe("QuestionRunner", () => {
  it("selects a choice with the keyboard and reports answered state", async () => {
    const user = userEvent.setup();
    render(<QuestionRunner attempt={attempt} />);
    await user.click(screen.getByLabelText("คำตอบ"));
    expect(screen.getAllByText("ตอบแล้ว")).toHaveLength(2);
  });

  it("shows remaining unanswered count before submission", async () => {
    const user = userEvent.setup();
    render(<QuestionRunner attempt={attempt} />);
    await user.click(screen.getByRole("button", { name: "ถัดไป" }));
    await user.click(screen.getByRole("button", { name: "ส่งคำตอบ" }));
    expect(screen.getByText(/ยังมี 2 ข้อที่ยังไม่ได้ตอบ/)).toBeInTheDocument();
  });

  it("accepts numeric input", async () => {
    const user = userEvent.setup();
    render(<QuestionRunner attempt={attempt} />);
    await user.click(screen.getByRole("button", { name: "ถัดไป" }));
    await user.type(screen.getByLabelText("คำตอบตัวเลข"), "42");
    expect(screen.getByDisplayValue("42")).toBeInTheDocument();
  });
});
