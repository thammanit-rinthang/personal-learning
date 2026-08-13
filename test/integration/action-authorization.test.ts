import { describe, it, expect, vi, beforeEach } from "vitest";
import { createCourseDraftAction } from "@/app/actions/course.actions";
import * as auth from "@/server/auth";
import { AppError } from "@/server/errors";

vi.mock("@/server/auth", () => ({
  requireCurrentActor: vi.fn(),
}));

describe("Action Authorization", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns unauthorized/forbidden when actor lacks permission", async () => {
    vi.mocked(auth.requireCurrentActor).mockRejectedValue(
      new AppError("FORBIDDEN", "You do not have permission to perform this action.")
    );

    const formData = new FormData();
    formData.append("title", "Test Course");
    formData.append("slug", "test-course");
    formData.append("subjectId", "sub-1");

    const result = await createCourseDraftAction(formData);

    expect(result.success).toBe(false);
    expect(result.error).toBe("You do not have permission to perform this action.");
  });
  
  it("returns unauthorized when unauthenticated", async () => {
    vi.mocked(auth.requireCurrentActor).mockRejectedValue(
      new AppError("UNAUTHORIZED", "Authentication required")
    );

    const formData = new FormData();
    
    const result = await createCourseDraftAction(formData);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Authentication required");
  });
});
