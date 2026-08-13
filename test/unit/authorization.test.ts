import { describe, expect, it } from "vitest";
import { requirePermission } from "@/server/authorization";
import { AppError } from "@/server/errors";

function expectForbidden(operation: () => void) {
  try {
    operation();
    throw new Error("Expected operation to throw.");
  } catch (error) {
    expect(error).toBeInstanceOf(AppError);
    expect(error).toMatchObject({ code: "FORBIDDEN", status: 403 });
  }
}

describe("authorization", () => {
  it("denies a learner course write access", () => {
    expectForbidden(() =>
      requirePermission(
        { id: "learner-1", type: "USER", role: "LEARNER", permissions: [] },
        "course:write",
      ),
    );
  });

  it("allows an editor lesson write access", () => {
    expect(() =>
      requirePermission(
        { id: "editor-1", type: "USER", role: "EDITOR", permissions: [] },
        "lesson:write",
      ),
    ).not.toThrow();
  });

  it("denies an MCP actor without the requested scope", () => {
    expectForbidden(() =>
      requirePermission(
        { id: "mcp-client-1", type: "MCP", permissions: ["course:read"] },
        "course:write",
      ),
    );
  });

  it("denies an MCP actor with an ADMIN role but no explicit publish scope", () => {
    expectForbidden(() =>
      requirePermission(
        { id: "mcp-admin-1", type: "MCP", role: "ADMIN", permissions: ["course:read"] },
        "publish:write",
      ),
    );
  });

  it("allows an MCP actor with an explicit publish scope", () => {
    expect(() =>
      requirePermission(
        { id: "mcp-publisher-1", type: "MCP", role: "ADMIN", permissions: ["publish:write"] },
        "publish:write",
      ),
    ).not.toThrow();
  });

  it("limits SYSTEM actors to explicit permissions", () => {
    expectForbidden(() =>
      requirePermission(
        { id: "system-admin-1", type: "SYSTEM", role: "ADMIN", permissions: [] },
        "publish:write",
      ),
    );

    expect(() =>
      requirePermission(
        { id: "system-publisher-1", type: "SYSTEM", permissions: ["publish:write"] },
        "publish:write",
      ),
    ).not.toThrow();
  });
});
