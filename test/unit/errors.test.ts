import { describe, expect, it } from "vitest";
import { AppError } from "@/server/errors";

describe("AppError", () => {
  it("uses the fixed status mapped to its safe code", () => {
    const error = new AppError("FORBIDDEN", "Forbidden.", { status: 200 } as never);

    expect(error.status).toBe(403);
  });

  it("exposes only safe serializable details", () => {
    const error = new AppError("VALIDATION", "Invalid input.", {
      details: {
        field: "title",
        nested: { reason: "required" },
        values: ["title", 1, true, null],
        unsafe: new Error("secret"),
      },
    } as never);

    expect(error.details).toEqual({
      field: "title",
      nested: { reason: "required" },
      values: ["title", 1, true, null],
    });
  });
});
