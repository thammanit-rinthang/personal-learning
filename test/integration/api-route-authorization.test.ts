import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/assessments/[assessmentId]/attempts/route";
import * as auth from "@/server/auth";
import { AppError } from "@/server/errors";
import { NextRequest } from "next/server";

vi.mock("@/server/auth", () => ({
  requireCurrentActor: vi.fn(),
}));

describe("API Route Authorization", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns 403 Forbidden when actor lacks permission", async () => {
    vi.mocked(auth.requireCurrentActor).mockRejectedValue(
      new AppError("FORBIDDEN", "You do not have permission to perform this action.")
    );

    const request = new NextRequest("http://localhost:3000/api/assessments/123/attempts", {
      method: "POST"
    });
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await POST(request, { params: Promise.resolve({ assessmentId: "123" }) as any });

    expect(response.status).toBe(403);
    const json = await response.json();
    expect(json.error).toBe("You do not have permission to perform this action.");
  });
  
  it("returns 401 Unauthorized when unauthenticated", async () => {
    vi.mocked(auth.requireCurrentActor).mockRejectedValue(
      new AppError("UNAUTHORIZED", "Authentication required")
    );

    const request = new NextRequest("http://localhost:3000/api/assessments/123/attempts", {
      method: "POST"
    });
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await POST(request, { params: Promise.resolve({ assessmentId: "123" }) as any });

    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json.error).toBe("Authentication required");
  });
});
