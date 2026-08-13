import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LessonRenderer } from "@/components/learning/lesson-renderer";

describe("LessonRenderer", () => {
  it("renders text, callout, example, and reference blocks as readable content", () => {
    render(<LessonRenderer blocks={[
      { id: "heading", type: "HEADING", contentMarkdown: "# Accounting Foundations", data: null },
      { id: "text", type: "MARKDOWN", contentMarkdown: "Assets = Liabilities + Equity.", data: null },
      { id: "callout", type: "CALLOUT", contentMarkdown: "Check both sides of the equation.", data: null },
      { id: "example", type: "EXAMPLE", contentMarkdown: "Cash investment increases assets and equity.", data: null },
      { id: "reference", type: "REFERENCE", contentMarkdown: "Week 01 reference", data: null },
    ]} />);

    expect(screen.getByRole("heading", { name: "Accounting Foundations" })).toBeInTheDocument();
    expect(screen.getByText("Assets = Liabilities + Equity.")).toBeInTheDocument();
    expect(screen.getByLabelText("ข้อควรทราบ")).toHaveTextContent("Check both sides of the equation.");
    expect(screen.getByText("ตัวอย่าง")).toBeInTheDocument();
    expect(screen.getByText("Week 01 reference")).toBeInTheDocument();
  });
});
