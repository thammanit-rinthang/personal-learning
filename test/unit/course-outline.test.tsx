import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LessonProgressStatus } from "@/app/generated/prisma/enums";
import { CourseOutline } from "@/components/learning/course-outline";

describe("CourseOutline", () => {
  it("communicates lesson completion with text in addition to visual status", () => {
    render(<CourseOutline course={{
      id: "course-1",
      slug: "accounting",
      title: "Accounting",
      description: null,
      subjectTitle: "Accounting",
      progress: { completedLessons: 1, totalLessons: 2, percent: 50 },
      modules: [{
        id: "module-1",
        slug: "module-1",
        title: "Module 01",
        description: null,
        position: 0,
        lessons: [
          { id: "lesson-1", slug: "foundations", title: "Foundations", summary: null, durationMin: 30, position: 0, status: LessonProgressStatus.COMPLETED },
          { id: "lesson-2", slug: "entries", title: "Entries", summary: null, durationMin: 30, position: 1, status: LessonProgressStatus.NOT_STARTED },
        ],
      }],
    }} />);

    expect(screen.getByText(/เรียนจบแล้ว/)).toBeInTheDocument();
    expect(screen.getByText(/ยังไม่เริ่ม/)).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "50");
  });
});
